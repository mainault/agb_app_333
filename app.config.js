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

  const androidPackage = 'com.mainault.agb_app_333';
  const iosBundleIdentifier = 'com.mainault.agbapp333';

  return {
    ...config,

    name: current.name,

    android: {
      ...config.android,
      package: `${androidPackage}${current.packageSuffix}`,
    },

    ios: {
      ...config.ios,
      bundleIdentifier: `${iosBundleIdentifier}${current.packageSuffix}`,
      supportsTablet: true,
      infoPlist: {
        ...config.ios?.infoPlist,
        ITSAppUsesNonExemptEncryption: false,
        CFBundleDevelopmentRegion: 'fr',
        CFBundleLocalizations: ['fr'],
      },
    },

    extra: {
      ...config.extra,
      apiUrl: current.apiUrl,
      env: ENV,
    },
    plugins: [
      ...(config.plugins ?? []),
      "expo-secure-store",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
            extraPods: [
              {
                name: "GoogleUtilities",
                modular_headers: true,
              },
            ],
          },
        },
      ],
    ],
  };
};