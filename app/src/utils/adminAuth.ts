import * as SecureStore from 'expo-secure-store';
import { appConfig } from '../config';

export type AdminSession = {
  admin: { id: number; name: string };
  expiresAt: string;
  permissions: { manageReservations: boolean };
};
type AuthResponse = AdminSession & { status: string; token?: string };

class AdminAuthError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'AdminAuthError';
  }
}

const TOKEN_KEY = appConfig.wpAdminApiUrl.includes('masoftware.ddns.net')
  ? 'agb_admin_token_dev' : 'agb_admin_token_prod';

async function callWordPress(
  action: 'login' | 'session' | 'logout',
  body: Record<string, string> = {},
  token?: string
): Promise<AuthResponse> {
  const baseUrl = appConfig.wpAdminApiUrl;
  if (!baseUrl) throw new Error('La connexion administrateur n’est pas configurée pour cet environnement.');
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
    try { data = JSON.parse(text); }
    catch { throw new Error('Réponse WordPress invalide. Vérifiez la connexion au site.'); }
    if (!response.ok) throw new AdminAuthError(
      typeof data?.message === 'string' ? data.message : 'La connexion WordPress a échoué.',
      response.status
    );
    if (data?.status !== 'OK') throw new Error('Réponse WordPress inattendue.');
    return data as AuthResponse;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('WordPress ne répond pas. Réessayez.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function validateSession(data: AuthResponse): AdminSession {
  if (
    !Number.isInteger(data.admin?.id) || data.admin.id <= 0 ||
    typeof data.admin.name !== 'string' ||
    data.permissions?.manageReservations !== true ||
    !Number.isFinite(Date.parse(data.expiresAt)) ||
    Date.parse(data.expiresAt) <= Date.now()
  ) throw new Error('Autorisation administrateur invalide ou expirée.');
  return { admin: data.admin, expiresAt: data.expiresAt, permissions: data.permissions };
}

export async function loginAdmin(login: string, password: string): Promise<AdminSession> {
  try {
    const data = await callWordPress('login', { login: login.trim(), password });
    const session = validateSession(data);
    if (!data.token || !/^[a-f0-9]{64}$/.test(data.token)) throw new Error('Jeton de connexion invalide.');
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    return session;
  } finally {}
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return null;
  try { return validateSession(await callWordPress('session', {}, token)); }
  catch (error) {
    if (error instanceof AdminAuthError && (error.status === 401 || error.status === 403)) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      return null;
    }
    throw error;
  }
}

export async function logoutAdmin(): Promise<void> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  try { if (token) await callWordPress('logout', {}, token); }
  finally { await SecureStore.deleteItemAsync(TOKEN_KEY); }
}

export async function checkBackendAdminSession(): Promise<void> {
  await sendAdminRequest({ operationType: 'checkMobileAdminSession' });
}

export async function sendAdminRequest<T = any>(data: Record<string, unknown>): Promise<T> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) throw new Error('Connectez-vous à l’administration.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  // Libellés fixes : aucune donnée métier issue de la requête n’est affichée.
  const label = data.operationType === 'getMobileAdminCompetitions'
    ? 'Backend compétitions (inclut contrôle WordPress)'
    : 'Backend administrateur';
  try {
    const response = await fetch(appConfig.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    const responseText = await response.text();
    let result: any;

    try {
        result = JSON.parse(responseText);
    } catch {
    throw new Error(
        `Réponse JSON invalide pour ${String(data.operationType)} ` +
        `(HTTP ${response.status}). Début de réponse : ` +
        responseText.slice(0, 500)
    );
    }
    if (response.status === 401 || response.status === 403) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
        throw new AdminAuthError('Votre session administrateur a expiré ou votre accès a été retiré.',  response.status);
    }
    if (!response.ok || result?.status !== 'OK') throw new Error(
      typeof result?.error === 'string' ? result.error : 'La demande administrateur a échoué.'
    );
    return result as T;
  } catch (error) {
    if (controller.signal.aborted) throw new Error(
      'Délai de réponse dépassé. Vérifiez le résultat avant de recommencer.'
    );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getAdminBootstrap<T>(): Promise<{
  session: AdminSession;
  competitions: T[];
} | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  // Aucun appel réseau si aucun jeton n’est enregistré.
  if (!token) return null;
  try {
    const response = await sendAdminRequest<
      AuthResponse & { competitions: T[] }
    >({
      operationType: 'getMobileAdminCompetitions',
    });
    const session = validateSession(response);
    if (!Array.isArray(response.competitions)) {
      throw new Error('Liste des compétitions invalide.');
    }
    return {
      session,
      competitions: response.competitions,
    };
  } catch (error) {
    if (
      error instanceof AdminAuthError &&
      (error.status === 401 || error.status === 403)
    ) {
      return null;
    }
    throw error;
  }
}
