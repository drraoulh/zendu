import * as Device from "expo-device";
import * as ScreenCapture from "expo-screen-capture";
import { Alert, Platform } from "react-native";
import { tr } from "./i18n";

/**
 * Écrans sensibles (carte, mot de passe, PIN, code de connexion, données personnelles) :
 * captures et enregistrements d'écran bloqués tant que l'écran est affiché (Android : FLAG_SECURE).
 */
export const useSecureScreen: (key?: string) => void =
  Platform.OS === "web" ? () => undefined : (key?: string) => ScreenCapture.usePreventScreenCapture(key);

/** iPhone : l'aperçu de l'appli dans le sélecteur d'applis est flouté (soldes, transferts). */
export async function enableAppSwitcherPrivacy() {
  if (Platform.OS !== "ios") return;
  await ScreenCapture.enableAppSwitcherProtectionAsync(0.9).catch(() => undefined);
}

let warned = false;

/**
 * Téléphone rooté (Android) ou jailbreaké (iPhone) : protections du système affaiblies.
 * Détection « expérimentale » d'Expo (faux positifs possibles) : on prévient, sans bloquer.
 */
export async function warnIfCompromisedDevice() {
  if (warned || Platform.OS === "web" || !Device.isDevice) return;
  warned = true;
  const rooted = await Device.isRootedExperimentalAsync().catch(() => false);
  if (!rooted) return;
  Alert.alert(
    tr("Appareil modifié détecté"),
    tr(
      "Ce téléphone semble rooté ou jailbreaké. Les protections de sécurité du système sont affaiblies et vos données pourraient être exposées. Nous vous recommandons d'utiliser WorldSoft Transfer sur un appareil non modifié.",
    ),
    [{ text: tr("J'ai compris") }],
  );
}
