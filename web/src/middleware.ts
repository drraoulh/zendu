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

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

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
