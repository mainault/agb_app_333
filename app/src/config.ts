export const config = {
  production: {
    apiUrl: 'https://as-golf-bauge.fr/agbCMS/httpInterface/ClientRequest.php'
  },
  development: {
    apiUrl: 'https://masoftware.ddns.net/agbCMS/httpInterface/ClientRequest.php'
  },
  preview: {
    apiUrl: 'https://masoftware.ddns.net/agbCMS/httpInterface/ClientRequest.php'
  },
};

const ENV = process.env.EXPO_PUBLIC_APP_ENV || 'production';
export const appConfig = config[ENV as keyof typeof config];