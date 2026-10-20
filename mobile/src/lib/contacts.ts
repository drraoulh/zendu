import { Platform } from "react-native";

export type PickedContact = { fullName: string; phones: string[] };

/**
 * Ouvre le sélecteur de contacts du téléphone (aucun accès à tout le carnet : seul le contact choisi
 * est lu). Renvoie null si l'utilisateur annule ou si l'appareil ne le permet pas.
 */
export async function pickContact(): Promise<PickedContact | null> {
  if (Platform.OS === "web") return null;
  // Chargé à la demande : une ancienne version de l'appli sans le module natif ne plante pas.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Contact, requestPermissionsAsync } = require("expo-contacts") as typeof import("expo-contacts");
  const read = async () => {
    const c = await Contact.presentPicker();
    if (!c) return null;
    const [fullName, phones] = await Promise.all([c.getFullName().catch(() => ""), c.getPhones().catch(() => [])]);
    return { fullName: fullName.trim(), phones: phones.map((p) => p.number ?? "").filter(Boolean) };
  };
  try {
    return await read();
  } catch {
    // Android : la lecture du contact choisi peut demander l'autorisation d'accès aux contacts.
    const { granted } = await requestPermissionsAsync();
    return granted ? read() : null;
  }
}

/** Numéro du contact ramené au format local du pays (sans indicatif ni zéro initial). */
export function localNumber(raw: string, dialCode: string): string {
  const code = dialCode.replace(/\D/g, "");
  let d = raw.replace(/\D/g, "");
  if (d.startsWith(`00${code}`)) d = d.slice(2 + code.length);
  else if (raw.trim().startsWith("+") && d.startsWith(code)) d = d.slice(code.length);
  else if (code === "1" && d.length === 11 && d.startsWith("1")) d = d.slice(1);
  return d.replace(/^0+/, "");
}
