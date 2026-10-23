import { NextResponse } from "next/server";
import { ADMIN_COOKIE, readCookie, readSessionToken, sessionCookieOptions } from "@/lib/admin-auth";
import { auditAdmin, clientIp, revokeAdminSession, sameOrigin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

/**
 * Déconnexion (POST uniquement, depuis le site lui-même) : la session est révoquée en base, puis le
 * cookie est supprimé. Un lien GET ne peut donc pas déconnecter l'équipe à son insu.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Requête refusée (origine)" }, { status: 403 });
  const claims = await readSessionToken(readCookie(request.headers.get("cookie"), ADMIN_COOKIE));
  if (claims) {
    await revokeAdminSession(claims.sid).catch((err: unknown) => console.error("[admin] révocation impossible", err));
    await auditAdmin({ action: "logout", sessionId: claims.sid, ip: clientIp(request.headers) });
  }
  const response = NextResponse.redirect(new URL("/admin/login?logout=1", request.url), 303);
  response.cookies.set(ADMIN_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
