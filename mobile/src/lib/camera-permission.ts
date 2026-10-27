import { Camera } from "expo-camera";
import { Alert, Linking, Platform } from "react-native";
import { tr } from "@/lib/i18n";

/**
 * Vérifie l'accès à l'appareil photo avant une étape qui en a besoin (vérification d'identité…).
 * - Déjà autorisé : true.
 * - Jamais demandé (ou redemandable) : la fenêtre système s'ouvre.
 * - Refusé définitivement (« Ne plus demander », réglage du fabricant) : fenêtre expliquant pourquoi,
 *   avec un bouton qui ouvre directement les réglages de l'application.
 * Renvoie false si l'accès n'est pas accordé : l'étape ne doit pas démarrer.
 */
export async function ensureCameraPermission(reason: string): Promise<boolean> {
  if (Platform.OS === "web") return true;
  try {
    let perm = await Camera.getCameraPermissionsAsync();
    if (perm.granted) return true;
    if (perm.canAskAgain) {
      perm = await Camera.requestCameraPermissionsAsync();
      if (perm.granted) return true;
    }
    showSettingsPrompt(reason);
    return false;
  } catch {
    // Module caméra indisponible : on laisse l'étape suivante gérer (elle demandera elle-même).
    return true;
  }
}

function showSettingsPrompt(reason: string) {
  Alert.alert(
    tr("Appareil photo bloqué"),
    `${reason}\n\n${tr("Ouvrez les réglages, puis Autorisations › Appareil photo › Autoriser.")}`,
    [
      { text: tr("Plus tard"), style: "cancel" },
      { text: tr("Ouvrir les réglages"), onPress: () => void Linking.openSettings() },
    ],
  );
}
