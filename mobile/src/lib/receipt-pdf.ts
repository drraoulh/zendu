import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { API_URL, authHeaders } from "./api";

/**
 * Télécharge le reçu PDF généré par le serveur (GET /api/transfers/{id}/receipt/pdf, avec le jeton
 * du client) puis ouvre la feuille de partage (enregistrer dans Fichiers, WhatsApp, courriel…).
 */
export async function shareReceiptPdf(transferId: string, reference: string, lang = "fr"): Promise<void> {
  const url = `${API_URL}/api/transfers/${encodeURIComponent(transferId)}/receipt/pdf?lang=${lang}`;
  if (Platform.OS === "web") {
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error("Reçu indisponible pour le moment. Réessayez dans un instant.");
    const blobUrl = URL.createObjectURL(await res.blob());
    window.open(blobUrl, "_blank");
    return;
  }
  const name = `recu-${reference.replace(/[^\w-]/g, "")}.pdf`;
  let file: File;
  try {
    file = await File.downloadFileAsync(url, new File(Paths.cache, name), { headers: authHeaders(), idempotent: true });
  } catch {
    throw new Error("Reçu indisponible pour le moment. Vérifiez votre connexion et réessayez.");
  }
  if (!(await Sharing.isAvailableAsync())) throw new Error("Le partage n'est pas disponible sur cet appareil.");
  await Sharing.shareAsync(file.uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: `Reçu ${reference}` });
}
