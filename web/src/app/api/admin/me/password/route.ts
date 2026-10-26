import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auditAdmin, clientIp, requireAdminIdentity } from "@/lib/admin-guard";
import { adminPasswordProblem, hashPassword, verifyPassword } from "@/lib/admin-users";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({ current: z.string().max(200), next: z.string().max(200) });

/** Changer son mot de passe (compte individuel). Les autres sessions de la personne sont fermées. */
export async function POST(request: Request) {
  const me = await requireAdminIdentity(request);
  if (me instanceof NextResponse) return me;
  if (!me.userId) return NextResponse.json({ error: "Compte provisoire : créez d'abord votre compte personnel (Sécurité)." }, { status: 400 });
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  if (!(await rateLimit(`admin-me-password:${me.userId}`, 5, 15 * 60 * 1000))) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez dans 15 minutes." }, { status: 429 });
  }
  const user = await prisma.adminUser.findUnique({ where: { id: me.userId } });
  if (!user || !(await verifyPassword(body.data.current, user.passwordHash))) {
    await auditAdmin({ action: "admin.password", actor: me.username, sessionId: me.sid, ok: false, ip: clientIp(request.headers) });
    return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 400 });
  }
  const problem = adminPasswordProblem(body.data.next);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  if (body.data.next === body.data.current) return NextResponse.json({ error: "Choisissez un mot de passe différent de l'actuel." }, { status: 400 });
  await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(body.data.next), mustChangePassword: false } });
  await prisma.adminSession.updateMany({
    where: { adminUserId: user.id, revokedAt: null, ...(me.sid ? { id: { not: me.sid } } : {}) },
    data: { revokedAt: new Date() },
  });
  await auditAdmin({ action: "admin.password", actor: me.username, sessionId: me.sid, ip: clientIp(request.headers) });
  return NextResponse.json({ ok: true });
}
