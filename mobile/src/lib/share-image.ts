import * as Sharing from "expo-sharing";
import type { RefObject } from "react";
import { Platform, type View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { shareText } from "./share";

/**
 * Partage une vue sous forme d'image (WhatsApp, SMS, courriel…). Sur le web, ou si la capture échoue,
 * le texte de secours est partagé (ou copié) à la place.
 */
export async function shareViewAsImage(ref: RefObject<View | null>, fallbackText: string, title: string) {
  if (Platform.OS !== "web" && ref.current) {
    try {
      const uri = await captureRef(ref, { format: "png", quality: 1, result: "tmpfile" });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: title, UTI: "public.png" });
        return "shared" as const;
      }
    } catch {
      /* on passe au texte */
    }
  }
  return shareText(fallbackText, title);
}
