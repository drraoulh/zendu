import * as WebBrowser from "expo-web-browser";
import { API_URL } from "./api";

/** Site vitrine PWFINTECH (par défaut : même domaine que l'API). */
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? API_URL).replace(/\/$/, "");

export function openSite(path: string) {
  return WebBrowser.openBrowserAsync(`${SITE_URL}${path}`);
}
