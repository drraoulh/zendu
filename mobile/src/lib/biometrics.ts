import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

export type BiometricKind = "face" | "fingerprint" | "none";

/** Type de biométrie disponible et configurée sur l'appareil. */
export async function biometricKind(): Promise<BiometricKind> {
  if (Platform.OS === "web") return "none";
  try {
    if (!(await LocalAuthentication.hasHardwareAsync()) || !(await LocalAuthentication.isEnrolledAsync())) return "none";
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) ? "face" : "fingerprint";
  } catch {
    return "none";
  }
}

export function biometricLabel(kind: BiometricKind) {
  if (kind === "face") return Platform.OS === "ios" ? "Face ID" : "reconnaissance faciale";
  if (kind === "fingerprint") return Platform.OS === "ios" ? "Touch ID" : "empreinte digitale";
  return "biométrie";
}

export async function authenticate(reason: string) {
  if (Platform.OS === "web") return { ok: false as const, error: "La biométrie n'est disponible que sur téléphone." };
  try {
    const res = await LocalAuthentication.authenticateAsync({ promptMessage: reason, cancelLabel: "Annuler", disableDeviceFallback: false });
    return res.success ? { ok: true as const } : { ok: false as const, error: res.error === "user_cancel" ? "Annulé" : "Identité non reconnue" };
  } catch {
    return { ok: false as const, error: "Biométrie indisponible sur cet appareil" };
  }
}
