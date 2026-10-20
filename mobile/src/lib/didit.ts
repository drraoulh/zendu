import { Platform, TurboModuleRegistry } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { tr } from "@/lib/i18n";

export type DiditOutcome = { kind: "done" } | { kind: "cancelled" } | { kind: "failed"; message: string };

type DiditSdk = typeof import("@didit-protocol/sdk-react-native");

/**
 * SDK natif Didit, ou null s'il n'est pas compilé dans l'appli (web, Expo Go).
 * Le paquet appelle `TurboModuleRegistry.getEnforcing` dès son chargement : on vérifie donc la
 * présence du module natif AVANT le `require`, sinon l'invariant remonte en erreur rouge.
 */
function loadDiditSdk(): DiditSdk | null {
  if (Platform.OS === "web" || !TurboModuleRegistry.get("SdkReactNative")) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@didit-protocol/sdk-react-native");
  } catch {
    return null;
  }
}

/**
 * Lance la vérification Didit :
 * - téléphone (APK / iOS) : SDK natif Didit, recommandé par Didit (caméra et selfie natifs) ;
 * - web, ou SDK natif absent (Expo Go) : page sécurisée Didit dans le navigateur.
 * Le résultat réel est toujours relu sur notre serveur, qui le redemande à Didit.
 */
export async function runDiditVerification(session: { url: string; sessionToken: string | null }): Promise<DiditOutcome> {
  if (session.sessionToken) {
    // Chargé à la demande : le module natif n'existe ni sur le web ni dans Expo Go.
    const sdk = loadDiditSdk();
    if (sdk) {
      try {
        const result = await sdk.startVerification(session.sessionToken, { languageCode: "fr", showExitConfirmation: true });
        if (result.type === "cancelled") return { kind: "cancelled" };
        if (result.type === "failed") return { kind: "failed", message: result.error?.message || tr("La vérification n'a pas pu aboutir.") };
        return { kind: "done" };
      } catch {
        // Module natif indisponible : on bascule sur la page web ci-dessous.
      }
    }
  }
  await WebBrowser.openBrowserAsync(session.url).catch(() => undefined);
  return { kind: "done" };
}
