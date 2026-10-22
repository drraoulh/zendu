// Complète app.json au moment de la construction, sans rien écrire de secret dans le dépôt :
// - EXPO_PUBLIC_EAS_PROJECT_ID : identifiant du projet Expo (notifications push) ;
// - google-services.json (Firebase, notifications Android) : utilisé s'il est présent.
const fs = require("fs");
const path = require("path");

module.exports = ({ config }) => {
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
  const googleServices = process.env.GOOGLE_SERVICES_FILE || "./google-services.json";
  const hasGoogleServices = fs.existsSync(path.resolve(__dirname, googleServices));
  return {
    ...config,
    android: { ...config.android, ...(hasGoogleServices ? { googleServicesFile: googleServices } : {}) },
    extra: { ...config.extra, ...(projectId ? { eas: { ...(config.extra?.eas ?? {}), projectId } } : {}) },
  };
};
