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

  const current = environments[ENV] ?? environments.development;

  const basePackage = 'com.mainault.agb_app_333';

  return {
    ...config,

    name: current.name,

    android: {
      ...config.android,
      package: `${basePackage}${current.packageSuffix}`,
    },

    ios: {
      ...config.ios,
      bundleIdentifier: `${basePackage}${current.packageSuffix}`,
      supportsTablet: true,
    },

    extra: {
      ...config.extra,
      apiUrl: current.apiUrl,
      env: ENV,
    },
  };
};