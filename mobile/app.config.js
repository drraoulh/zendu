// Complète app.json au moment de la construction, sans rien écrire de secret dans le dépôt :
// - EXPO_PUBLIC_EAS_PROJECT_ID : identifiant du projet Expo (notifications push) ;
// - google-services.json (Firebase, notifications Android) : utilisé s'il est présent ;
// - APK_ARM64_ONLY=1 (profil « preview ») : APK de test limité aux téléphones 64 bits récents, bien plus léger.
//   Le profil de production (AAB pour le Play Store) garde toutes les architectures.
const fs = require("fs");
const path = require("path");

module.exports = ({ config }) => {
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
  const googleServices = process.env.GOOGLE_SERVICES_FILE || "./google-services.json";
  // eslint-disable-next-line no-undef
  const hasGoogleServices = fs.existsSync(path.resolve(__dirname, googleServices));
  const plugins = [...(config.plugins ?? [])];
  if (process.env.APK_ARM64_ONLY === "1") plugins.push(["expo-build-properties", { android: { buildArchs: ["arm64-v8a"] } }]);
  return {
    ...config,
    plugins,
    android: { ...config.android, ...(hasGoogleServices ? { googleServicesFile: googleServices } : {}) },
    extra: { ...config.extra, ...(projectId ? { eas: { ...(config.extra?.eas ?? {}), projectId } } : {}) },
  };
};
