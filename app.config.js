export default ({ config }) => {
  const ENV = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';

  const environments = {
    development: {
      name: 'AS Golf de Baugé (Dev)',
      apiUrl: 'https://masoftware.ddns.net/agbCMS/httpInterface/ClientRequest.php',
      packageSuffix: '.dev',
    },
    preview: {
      name: 'AS Golf de Baugé (Preview)',
      apiUrl: 'https://masoftware.ddns.net/agbCMS/httpInterface/ClientRequest.php',
      packageSuffix: '.preview',
    },
    production: {
      name: 'AS Golf de Baugé',
      apiUrl: 'https://as-golf-bauge.fr/agbCMS/httpInterface/ClientRequest.php',
      packageSuffix: '',
    },
  };

  if (!environments[ENV]) {
    console.warn(`⚠️ Unknown ENV "${ENV}", fallback to development`);
  }

  const current = environments[ENV] ?? environments.development;

  return {
    ...config,

    name: current.name,

    android: {
      ...config.android,
      package: `com.mainault.agb_app_333${current.packageSuffix}`,
    },

    extra: {
      ...config.extra,
      apiUrl: current.apiUrl,
      env: ENV,
    },
  };
};