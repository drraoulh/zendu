import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auditAdmin, clientIp, requireAdminIdentity } from "@/lib/admin-guard";
import { hashPassword, temporaryPassword } from "@/lib/admin-users";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ action: z.enum(["deactivate", "activate", "reset-password", "reset-2fa"]) });

/**
 * Gestion d'un compte de l'équipe : désactiver / réactiver, nouveau mot de passe temporaire,
 * retrait du code à 6 chiffres (téléphone perdu). Jamais sur son propre compte (sauf réactivation impossible
 * par définition). Toute action ferme les sessions ouvertes de ce compte.
 */
export async function PATCH(request: Request, { params }: Params) {
  const me = await requireAdminIdentity(request);
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  if (id === me.userId) return NextResponse.json({ error: "Utilisez « Mon compte » pour votre propre compte." }, { status: 400 });
  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

  const action = body.data.action;
  if (action === "deactivate") {
    // Ne jamais retirer le dernier compte actif (l'admin deviendrait inaccessible).
    const others = await prisma.adminUser.count({ where: { active: true, id: { not: id } } });
    if (others === 0) return NextResponse.json({ error: "Impossible : c'est le dernier compte actif." }, { status: 400 });
  }
  let temp: string | undefined;
  const data =
    action === "deactivate"
      ? { active: false }
      : action === "activate"
        ? { active: true }
        : action === "reset-2fa"
          ? { totpSecretEnc: null, totpLastStep: null }
          : { passwordHash: await hashPassword((temp = temporaryPassword())), mustChangePassword: true };
  await prisma.adminUser.update({ where: { id }, data });
  if (action !== "activate") {
    await prisma.adminSession.updateMany({ where: { adminUserId: id, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  await auditAdmin({ action: `admin.user.${action}`, actor: me.username, sessionId: me.sid, target: user.username, ip: clientIp(request.headers) });
  return NextResponse.json({ ok: true, ...(temp ? { temporaryPassword: temp } : {}) });
}
