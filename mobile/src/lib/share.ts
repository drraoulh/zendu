import * as Clipboard from "expo-clipboard";
import { useEffect, useRef, useState } from "react";
import { Share } from "react-native";

/**
 * Partage un texte. Si la feuille de partage n'existe pas (navigateur sans Web Share, ex. Chrome
 * sur ordinateur), le texte est copié dans le presse-papiers.
 * Renvoie "copied" dans ce cas pour que l'écran affiche « Copié ».
 */
export async function shareText(message: string, title?: string): Promise<"shared" | "copied" | "failed"> {
  try {
    await Share.share(title ? { message, title } : { message });
    return "shared";
  } catch (e) {
    // L'utilisateur a fermé la feuille de partage : rien à faire.
    if (e instanceof Error && e.name === "AbortError") return "shared";
    try {
      await Clipboard.setStringAsync(message);
      return "copied";
    } catch {
      return "failed";
    }
  }
}

/** Bouton « Partager » : affiche « Copié » quelques secondes quand le texte a été copié faute de partage natif. */
export function useShare(label = "Partager") {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  async function share(message: string, title?: string) {
    const r = await shareText(message, title);
    if (r === "shared") return;
    setState(r);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  }
  return { share, label: state === "copied" ? "Copié" : state === "failed" ? "Partage indisponible" : label, copied: state === "copied" };
}
