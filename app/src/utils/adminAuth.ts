import * as SecureStore from 'expo-secure-store';
import { appConfig } from '../config';

export type AdminSession = {
  admin: { id: number; name: string };
  expiresAt: string;
  permissions: { manageReservations: boolean };
};
type AuthResponse = AdminSession & { status: string; token?: string };

class AdminAuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'AdminAuthError';
  }
}

// Couples API/WordPress autorisés. Aucun mélange DEV/PROD.
const LOCAL_SESSION_ENABLED = (() => {
  const api = new URL(appConfig.apiUrl);
  const wp = new URL(appConfig.wpAdminApiUrl);
  if (api.protocol !== 'https:' || wp.protocol !== 'https:') return false;
  if (api.hostname === 'masoftware.ddns.net' && wp.hostname === api.hostname)
    return true;
  const productionHosts = new Set(['as-golf-bauge.fr', 'www.as-golf-bauge.fr']);
  return productionHosts.has(api.hostname) && productionHosts.has(wp.hostname);
})();
const TOKEN_KEY = appConfig.wpAdminApiUrl.includes('masoftware.ddns.net')
  ? 'agb_admin_token_dev'
  : 'agb_admin_token_prod';
const LOCAL_TOKEN_KEY = TOKEN_KEY + '_agb_local_v1';
const RESERVATION_WRITES = new Set([
  'setResaMember',
  'setMassResaTeam',
  'setResaTeam',
  'removeResaTeam',
  'removeResaUser',
]);

async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(LOCAL_TOKEN_KEY),
  ]);
}

async function callWordPress(
  action: 'login' | 'session' | 'logout',
  body: Record<string, string> = {},
  token?: string,
): Promise<AuthResponse> {
  const baseUrl = appConfig.wpAdminApiUrl;
  if (!baseUrl)
    throw new Error(
      'La connexion administrateur n’est pas configurée pour cet environnement.',
    );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(baseUrl + action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        'Réponse WordPress invalide. Vérifiez la connexion au site.',
      );
    }
    if (!response.ok)
      throw new AdminAuthError(
        typeof data?.message === 'string'
          ? data.message
          : 'La connexion WordPress a échoué.',
        response.status,
      );
    if (data?.status !== 'OK') throw new Error('Réponse WordPress inattendue.');
    return data as AuthResponse;
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error('WordPress ne répond pas. Réessayez.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function validateSession(data: AuthResponse): AdminSession {
  if (
    !Number.isInteger(data.admin?.id) ||
    data.admin.id <= 0 ||
    typeof data.admin.name !== 'string' ||
    data.permissions?.manageReservations !== true ||
    !Number.isFinite(Date.parse(data.expiresAt)) ||
    Date.parse(data.expiresAt) <= Date.now()
  )
    throw new Error('Autorisation administrateur invalide ou expirée.');
  return {
    admin: data.admin,
    expiresAt: data.expiresAt,
    permissions: data.permissions,
  };
}

function validToken(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

async function callBackend<T>(
  data: Record<string, unknown>,
  token: string,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  const started = Date.now();
  try {
    const response = await fetch(appConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    const responseText = await response.text();
    // Une erreur HTTP d’autorisation reste reconnue même si la réponse n’est pas JSON.
    if (response.status === 401 || response.status === 403) {
      throw new AdminAuthError(
        'Votre session administrateur a expiré ou votre accès a été retiré.',
        response.status,
      );
    }
    let result: any;
    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(
        `Réponse JSON invalide pour ${String(data.operationType)} (HTTP ${response.status}). Début de réponse : ` +
          responseText.slice(0, 500),
      );
    }
    if (!response.ok || result?.status !== 'OK')
      throw new Error(
        typeof result?.error === 'string'
          ? result.error
          : 'La demande administrateur a échoué.',
      );
    return result as T;
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error(
        'Délai de réponse dépassé. Vérifiez le résultat avant de recommencer.',
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function loginAdmin(
  login: string,
  password: string,
): Promise<AdminSession> {
  const data = await callWordPress('login', { login: login.trim(), password });
  const wordpressSession = validateSession(data);
  if (!validToken(data.token)) throw new Error('Jeton de connexion invalide.');
  const wordpressToken = data.token;
  let localToken: string | undefined;
  try {
    let session = wordpressSession;
    if (LOCAL_SESSION_ENABLED) {
      // Le backend valide le jeton auprès de WP avant d’émettre son propre jeton.
      const grant = await callBackend<AuthResponse>(
        { operationType: 'startMobileAdminSession' },
        wordpressToken,
      );
      session = validateSession(grant);
      if (!validToken(grant.token))
        throw new Error('Jeton de session locale invalide.');
      localToken = grant.token;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, wordpressToken);
    if (localToken) await SecureStore.setItemAsync(LOCAL_TOKEN_KEY, localToken);
    return session;
  } catch (error) {
    // Nettoyage après échec de création/stockage, sans relancer une création.
    if (localToken) {
      try {
        await callBackend(
          { operationType: 'logoutMobileAdminSession' },
          localToken,
        );
      } catch {}
    }
    try {
      await callWordPress('logout', {}, wordpressToken);
    } catch {}
    await clearTokens();
    throw error;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = await SecureStore.getItemAsync(
    LOCAL_SESSION_ENABLED ? LOCAL_TOKEN_KEY : TOKEN_KEY,
  );
  if (!token) return null;
  try {
    const response = LOCAL_SESSION_ENABLED
      ? await callBackend<AuthResponse>(
          { operationType: 'getMobileAdminSession' },
          token,
        )
      : await callWordPress('session', {}, token);
    return validateSession(response);
  } catch (error) {
    if (
      error instanceof AdminAuthError &&
      (error.status === 401 || error.status === 403)
    ) {
      await clearTokens();
      return null;
    }
    throw error;
  }
}

export async function logoutAdmin(): Promise<void> {
  const [wordpressToken, localToken] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(LOCAL_TOKEN_KEY),
  ]);
  let failure: unknown;
  try {
    // Révoquer d’abord la session AGB, indépendamment du délai WordPress.
    if (LOCAL_SESSION_ENABLED && localToken) {
      try {
        await callBackend(
          { operationType: 'logoutMobileAdminSession' },
          localToken,
        );
      } catch (error) {
        failure = error;
      }
    }
    if (wordpressToken) {
      try {
        await callWordPress('logout', {}, wordpressToken);
      } catch (error) {
        failure ??= error;
      }
    }
  } finally {
    await clearTokens();
  }
  if (failure) throw failure; // L’écran existant signale une révocation non confirmée.
}

export async function checkBackendAdminSession(): Promise<void> {
  await sendAdminRequest({ operationType: 'checkMobileAdminSession' });
}

export async function sendAdminRequest<T = any>(
  data: Record<string, unknown>,
): Promise<T> {
  const token = await SecureStore.getItemAsync(
    LOCAL_SESSION_ENABLED ? LOCAL_TOKEN_KEY : TOKEN_KEY,
  );
  if (!token) throw new Error('Connectez-vous à l’administration.');
  const request =
    LOCAL_SESSION_ENABLED &&
    typeof data.operationType === 'string' &&
    RESERVATION_WRITES.has(data.operationType)
      ? {
          operationType: 'executeMobileAdminReservation',
          reservationRequest: data,
        }
      : data;
  try {
    return await callBackend<T>(request, token);
  } catch (error) {
    if (
      error instanceof AdminAuthError &&
      (error.status === 401 || error.status === 403)
    ) {
      await clearTokens();
    }
    throw error;
  }
}

export async function getAdminBootstrap<T>(): Promise<{
  session: AdminSession;
  competitions: T[];
} | null> {
  const token = await SecureStore.getItemAsync(
    LOCAL_SESSION_ENABLED ? LOCAL_TOKEN_KEY : TOKEN_KEY,
  );
  if (!token) return null;
  try {
    const response = await sendAdminRequest<
      AuthResponse & { competitions: T[] }
    >({
      operationType: 'getMobileAdminCompetitions',
    });
    const session = validateSession(response);
    if (!Array.isArray(response.competitions))
      throw new Error('Liste des compétitions invalide.');
    return { session, competitions: response.competitions };
  } catch (error) {
    if (
      error instanceof AdminAuthError &&
      (error.status === 401 || error.status === 403)
    )
      return null;
    throw error;
  }
}
