import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { ADMIN_COOKIE, adminMode, verifySessionToken } from "@/lib/admin-auth";

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

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

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
