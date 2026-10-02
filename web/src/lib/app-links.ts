/**
 * Liens de téléchargement de l'application mobile WorldSoft Transfer (une solution PWFINTECH).
 * Renseignés via NEXT_PUBLIC_APP_STORE_URL / NEXT_PUBLIC_PLAY_STORE_URL ; chaîne vide → null.
 */
function link(value: string | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

export const appLinks: { ios: string | null; android: string | null } = {
  ios: link(process.env.NEXT_PUBLIC_APP_STORE_URL),
  android: link(process.env.NEXT_PUBLIC_PLAY_STORE_URL),
};

export const appName = "WorldSoft Transfer";

/** Au moins un lien de store est configuré. */
export function appAvailable(): boolean {
  return Boolean(appLinks.ios || appLinks.android);
}

/** Les écrans d'envoi web (/send, /history…) sont-ils ouverts au public (démo/tests) ? */
export const webTransfersEnabled = process.env.NEXT_PUBLIC_WEB_TRANSFERS_ENABLED === "true";

/** Lien vers la page /application, en conservant la simulation éventuelle. */
export function applicationHref(params?: { corridor?: string | null; amount?: number | string | null }): string {
  const qs = new URLSearchParams();
  if (params?.corridor) qs.set("corridor", params.corridor);
  if (params?.amount != null && params.amount !== "" && Number.isFinite(Number(params.amount)) && Number(params.amount) > 0) {
    qs.set("amount", String(params.amount));
  }
  const s = qs.toString();
  return s ? `/application?${s}` : "/application";
}

export type DevicePlatform = "ios" | "android" | "desktop";

/** Détection d'appareil (côté client uniquement), iPadOS inclus (se présente comme un Mac tactile). */
export function detectPlatform(): DevicePlatform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Macintosh/i.test(ua) && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1) return "ios";
  return "desktop";
}
