import { NextResponse } from "next/server";
import { ADMIN_COOKIE, sessionCookieOptions } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function logout(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login?logout=1", request.url), 303);
  response.cookies.set(ADMIN_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}

/** Déconnexion : supprime le cookie de session et renvoie vers /admin/login. */
export const POST = logout;
export const GET = logout;
