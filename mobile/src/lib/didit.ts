import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

export type DiditOutcome = { kind: "done" } | { kind: "cancelled" } | { kind: "failed"; message: string };

/**
 * Lance la vérification Didit :
 * - téléphone (APK / iOS) : SDK natif Didit, recommandé par Didit (caméra et selfie natifs) ;
 * - web, ou SDK natif absent (Expo Go) : page sécurisée Didit dans le navigateur.
 * Le résultat réel est toujours relu sur notre serveur, qui le redemande à Didit.
 */
export async function runDiditVerification(session: { url: string; sessionToken: string | null }): Promise<DiditOutcome> {
  if (Platform.OS !== "web" && session.sessionToken) {
    let sdk: typeof import("@didit-protocol/sdk-react-native") | null = null;
    try {
      // Chargé à la demande : le module natif n'existe ni sur le web ni dans Expo Go.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      sdk = require("@didit-protocol/sdk-react-native");
    } catch {
      sdk = null;
    }
    if (sdk) {
      try {
        const result = await sdk.startVerification(session.sessionToken, { languageCode: "fr", showExitConfirmation: true });
        if (result.type === "cancelled") return { kind: "cancelled" };
        if (result.type === "failed") return { kind: "failed", message: result.error?.message || "La vérification n'a pas pu aboutir." };
        return { kind: "done" };
      } catch {
        // Module natif indisponible : on bascule sur la page web ci-dessous.
      }
    }
  }
  await WebBrowser.openBrowserAsync(session.url).catch(() => undefined);
  return { kind: "done" };
}
