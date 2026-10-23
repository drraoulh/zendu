import { NextResponse } from "next/server";
import { ADMIN_COOKIE, readCookie, readSessionToken } from "@/lib/admin-auth";
import { auditAdmin, clientIp, requireAdmin, revokeAllAdminSessions } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

/**
 * Révocation des sessions admin. Corps : { scope: "others" } (toutes sauf celle-ci, par défaut)
 * ou { scope: "all" } (y compris celle-ci : déconnexion immédiate).
 */
export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as { scope?: unknown };
  const scope = body.scope === "all" ? "all" : "others";
  const current = await readSessionToken(readCookie(request.headers.get("cookie"), ADMIN_COOKIE));
  const revoked = await revokeAllAdminSessions(scope === "others" ? current?.sid : undefined);
  await auditAdmin({ action: "sessions.revoke", sessionId: current?.sid ?? null, ip: clientIp(request.headers), details: { scope, revoked } });
  return NextResponse.json({ ok: true, revoked, scope });
}
