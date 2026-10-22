import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { ADMIN_COOKIE, adminMode, verifySessionToken } from "@/lib/admin-auth";
import { siteForHost, siteOfPath, siteOrigin } from "@/lib/site";

/**
 * Écrans d'envoi web conservés dans le code (moteur de l'app WorldSoft Transfer) mais fermés au
 * public : sans WEB_TRANSFERS_ENABLED=true, ils redirigent vers /application.
 * /api/**, /admin et /auth/callback ne sont jamais concernés par ce blocage.
 * /admin/** est en revanche réservé à l'équipe (voir src/lib/admin-auth.ts).
 */
const BLOCKED_EXACT = new Set(["/send", "/history", "/refer", "/login", "/signup"]);

function isBlocked(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return BLOCKED_EXACT.has(path) || path === "/transfers" || path.startsWith("/transfers/");
}

/** /admin/** (hors /admin/login et /admin/logout) exige une session admin. Les API /api/admin/** sont protégées route par route. */
function isProtectedAdminPath(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (path !== "/admin" && !path.startsWith("/admin/")) return false;
  return path !== "/admin/login" && path !== "/admin/logout";
}

/**
 * CORS pour l'app WorldSoft Transfer en version web (Expo web) : uniquement sur les API publiques
 * et pour les origines listées dans MOBILE_CORS_ORIGINS (séparées par des virgules).
 * Les apps iOS/Android natives n'envoient pas d'en-tête Origin et n'en ont pas besoin.
 */
const PUBLIC_API = /^\/api\/(quotes|transfers|requests|shipments|appointments|waitlist|auth|me)(\/|$)/;

function corsOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const allowed = (process.env.MOBILE_CORS_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV !== "production") allowed.push("http://localhost:8081", "http://localhost:8082");
  return allowed.includes(origin) ? origin : null;
}

function withCors(response: NextResponse, origin: string): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Vary", "Origin");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Max-Age", "600");
  return response;
}

/** En-têtes de sécurité communs (pages et API). Pas de CSP stricte : scripts inline de Next / Tailwind. */
function withSecurityHeaders(response: NextResponse, pathname: string): NextResponse {
  const h = response.headers;
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("X-Frame-Options", "DENY");
  h.set("Content-Security-Policy", "frame-ancestors 'none'");
  h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  if (process.env.NODE_ENV === "production") h.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  // Données de compte, jetons, transferts : jamais en cache (navigateur, proxy, CDN).
  if (/^\/api\/(auth|me|transfers|admin)(\/|$)/.test(pathname)) h.set("Cache-Control", "no-store");
  return response;
}

export async function middleware(request: NextRequest) {
  return withSecurityHeaders(await route(request), request.nextUrl.pathname);
}

/**
 * Anciennes adresses Vercel des deux sites : leurs PAGES renvoient vers les vrais domaines
 * (NEXT_PUBLIC_PWFINTECH_URL / NEXT_PUBLIC_WST_URL). Les API n'y sont jamais redirigées : les
 * versions déjà installées de l'appli les appellent encore (une redirection perdrait l'en-tête
 * Authorization). zendu-vert.vercel.app (webhooks MTN et Didit) n'est pas concerné.
 */
const LEGACY_HOSTS: Record<string, string | undefined> = {
  "pwfintech.vercel.app": process.env.NEXT_PUBLIC_PWFINTECH_URL,
  "worldsoft-transfer.vercel.app": process.env.NEXT_PUBLIC_WST_URL,
};

function legacyRedirect(request: NextRequest): NextResponse | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api/") || pathname.startsWith("/auth/")) return null;
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0].trim().toLowerCase();
  const target = LEGACY_HOSTS[host.replace(/:\d+$/, "")]?.trim().replace(/\/+$/, "");
  if (!target) return null;
  try {
    return NextResponse.redirect(new URL(pathname + search, target), 308);
  } catch {
    return null;
  }
}

async function route(request: NextRequest): Promise<NextResponse> {
  const { pathname, searchParams } = request.nextUrl;

  const legacy = legacyRedirect(request);
  if (legacy) return legacy;

  if (PUBLIC_API.test(pathname)) {
    const origin = corsOrigin(request);
    if (request.method === "OPTIONS") {
      return origin ? withCors(new NextResponse(null, { status: 204 }), origin) : new NextResponse(null, { status: 204 });
    }
    const response = await updateSession(request);
    return origin ? withCors(response, origin) : response;
  }

  const hasAdminSession = async () => {
    const mode = adminMode();
    return (
      mode === "dev-open" ||
      (mode === "configured" && (await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value)))
    );
  };

  if (isProtectedAdminPath(pathname)) {
    const mode = adminMode();
    if (!(await hasAdminSession())) {
      const target = request.nextUrl.clone();
      target.pathname = "/admin/login";
      target.search = "";
      if (mode === "configured") target.searchParams.set("next", pathname + request.nextUrl.search);
      return NextResponse.redirect(target, 307);
    }
  }

  // Deux sites sur un même projet (voir src/lib/site.ts) : une page de l'autre site renvoie vers son domaine.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const site = siteForHost(host);
  const owner = siteOfPath(pathname);
  if (owner && owner !== site) {
    const origin = siteOrigin(owner, host);
    if (origin) {
      const target = new URL(pathname + request.nextUrl.search, origin);
      if (owner === "wst" && pathname.replace(/\/+$/, "") === "/transfert") target.pathname = "/";
      return NextResponse.redirect(target, 307);
    }
  }
  if (site === "wst") {
    const path = pathname.replace(/\/+$/, "") || "/";
    // La page produit /transfert est l'accueil de WorldSoft Transfer.
    if (path === "/transfert") {
      const target = request.nextUrl.clone();
      target.pathname = "/";
      return NextResponse.redirect(target, 308);
    }
    if (path === "/") {
      const session = await updateSession(request);
      const target = request.nextUrl.clone();
      target.pathname = "/transfert";
      const rewritten = NextResponse.rewrite(target);
      session.cookies.getAll().forEach((c) => rewritten.cookies.set(c));
      return rewritten;
    }
  }

  // L'équipe connectée à l'admin peut toujours ouvrir le suivi d'un transfert (/transfers/[id]).
  const adminTransferView = pathname.startsWith("/transfers/") && (await hasAdminSession());

  if (process.env.WEB_TRANSFERS_ENABLED !== "true" && isBlocked(pathname) && !adminTransferView) {
    const target = request.nextUrl.clone();
    target.pathname = "/application";
    target.search = "";
    if (pathname.replace(/\/+$/, "") === "/send") {
      const corridor = searchParams.get("corridor");
      const amount = searchParams.get("amount");
      if (corridor) target.searchParams.set("corridor", corridor);
      if (amount) target.searchParams.set("amount", amount);
    }
    return NextResponse.redirect(target, 307);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
