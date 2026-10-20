/**
 * Deux sites, un seul projet :
 * - PWFINTECH (site de l'entreprise : ses activités, à propos, contact) ;
 * - WorldSoft Transfer (le site de l'application de transfert d'argent).
 *
 * Le site affiché dépend du nom de domaine. Adresses à configurer :
 *   NEXT_PUBLIC_PWFINTECH_URL="https://pwfintech.ca"
 *   NEXT_PUBLIC_WST_URL="https://worldsofttransfer.com"
 * En développement : http://localhost:3000 ou http://pwfintech.localhost:3000 (PWFINTECH)
 * et http://wst.localhost:3000 (WorldSoft Transfer).
 * Sans adresse WorldSoft Transfer configurée, tout reste servi sur un même domaine (comportement d'avant).
 *
 * Utilisable dans le middleware, côté serveur et côté client (variables NEXT_PUBLIC_*).
 */

export type SiteId = "pwfintech" | "wst";

/** Pages propres à WorldSoft Transfer (ouvertes sur le domaine PWFINTECH, elles y redirigent). */
const WST_PATHS = ["/transfert", "/frais", "/pays", "/application", "/send", "/history", "/refer", "/transfers", "/login", "/signup", "/kyc"];
/** Pages propres à PWFINTECH. Les autres (contact, aide, légal, merci, admin, API, auth) sont communes. */
const PWFINTECH_PATHS = ["/finances", "/technologies", "/shipping", "/a-propos", "/avi", "/paiement-fournisseurs"];

function under(path: string, prefixes: string[]): boolean {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Site auquel appartient une page, ou null si elle est commune aux deux. */
export function siteOfPath(pathname: string): SiteId | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (under(path, WST_PATHS)) return "wst";
  if (under(path, PWFINTECH_PATHS)) return "pwfintech";
  return null;
}

function cleanUrl(value: string | undefined): string | null {
  const v = value?.trim().replace(/\/+$/, "");
  return v ? v : null;
}

const CONFIGURED: Record<SiteId, string | null> = {
  pwfintech: cleanUrl(process.env.NEXT_PUBLIC_PWFINTECH_URL),
  wst: cleanUrl(process.env.NEXT_PUBLIC_WST_URL),
};

function hostnameOf(host: string | null | undefined): string {
  return (host ?? "").trim().toLowerCase().split(",")[0].trim().replace(/:\d+$/, "");
}

function urlHostname(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname.endsWith(".localhost");
}

/** Site servi pour un en-tête Host (ou X-Forwarded-Host). */
export function siteForHost(host: string | null | undefined): SiteId {
  const h = hostnameOf(host);
  if (h && h === urlHostname(CONFIGURED.wst)) return "wst";
  if (h && h === urlHostname(CONFIGURED.pwfintech)) return "pwfintech";
  if (h.startsWith("wst.") || h.includes("worldsoft")) return "wst";
  return "pwfintech";
}

/**
 * Origine (https://domaine) d'un site, vue depuis l'hôte courant. null quand elle n'est pas connue :
 * dans ce cas, on reste sur le domaine courant.
 */
export function siteOrigin(site: SiteId, currentHost: string | null | undefined): string | null {
  if (CONFIGURED[site]) return CONFIGURED[site];
  const raw = (currentHost ?? "").trim().toLowerCase().split(",")[0].trim();
  const h = hostnameOf(raw);
  if (isLocalHost(h)) {
    const port = /:\d+$/.exec(raw)?.[0] ?? "";
    // Pas « localhost » nu : en dev, Next rend relative toute redirection vers son propre hôte (boucle).
    return `http://${site === "wst" ? "wst.localhost" : "pwfintech.localhost"}${port}`;
  }
  return null;
}

/** Les deux sites sont-ils réellement séparés pour cet hôte (deux domaines connus) ? */
export function sitesSplit(currentHost: string | null | undefined): boolean {
  const other = siteForHost(currentHost) === "wst" ? "pwfintech" : "wst";
  const origin = siteOrigin(other, currentHost);
  return !!origin && urlHostname(origin) !== hostnameOf(currentHost);
}
