// Preuve de propriété du package Android (validation des développeurs Android de Google Play).
// Google fournit un extrait unique, lié au compte développeur ; il doit se trouver dans le fichier
// assets/adi-registration.properties de l'APK signé avec la clé enregistrée. L'extrait n'est pas secret.
const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

module.exports = function withAdiRegistration(config) {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const snippet = fs.readFileSync(path.join(cfg.modRequest.projectRoot, "adi-registration.properties"), "utf8").trim();
      const assets = path.join(cfg.modRequest.platformProjectRoot, "app", "src", "main", "assets");
      fs.mkdirSync(assets, { recursive: true });
      fs.writeFileSync(path.join(assets, "adi-registration.properties"), `${snippet}\n`);
      return cfg;
    },
  ]);
};
