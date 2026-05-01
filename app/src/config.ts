export type AppEnv = 'production' | 'development' | 'preview';

const ENV_RAW = (process.env.EXPO_PUBLIC_APP_ENV || 'development').trim().toLowerCase();

const ENV: AppEnv =
  ENV_RAW === 'production'
    ? 'production'
    : ENV_RAW === 'preview'
    ? 'preview'
    : 'development';

export const config = {
  production: {
    apiUrl: 'https://as-golf-bauge.fr/agbCMS/httpInterface/ClientRequest.php'
  },
  development: {
    apiUrl: 'https://masoftware.ddns.net/agbCMS/httpInterface/ClientRequest.php'
  },
  preview: {
    apiUrl: 'https://masoftware.ddns.net/agbCMS/httpInterface/ClientRequest.php'
  }
} as const;

export const appConfig = config[ENV];