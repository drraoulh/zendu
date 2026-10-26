import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auditAdmin, clientIp, requireAdminIdentity } from "@/lib/admin-guard";
import { hashPassword, normalizeUsername, temporaryPassword, USERNAME_RE } from "@/lib/admin-users";
import { isUniqueViolation } from "@/lib/requests";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  username: z.string().trim().max(32),
  displayName: z.string().trim().min(2).max(80),
});

/** Liste des comptes de l'équipe (sans mot de passe ni secret). */
export async function GET(request: Request) {
  const me = await requireAdminIdentity(request);
  if (me instanceof NextResponse) return me;
  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      active: u.active,
      mfa: Boolean(u.totpSecretEnc),
      mustChangePassword: u.mustChangePassword,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
    })),
  });
}

/**
 * Nouveau compte : mot de passe temporaire renvoyé UNE fois (à transmettre de vive voix ou par un canal sûr),
 * à remplacer à la première connexion.
 */
export async function POST(request: Request) {
  const me = await requireAdminIdentity(request);
  if (me instanceof NextResponse) return me;
  const body = createSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Nom affiché requis (2 à 80 caractères)." }, { status: 400 });
  const username = normalizeUsername(body.data.username);
  if (!USERNAME_RE.test(username)) {
    return NextResponse.json({ error: "Identifiant : 3 à 32 caractères, lettres minuscules, chiffres, point, tiret." }, { status: 400 });
  }
  const temp = temporaryPassword();
  try {
    const user = await prisma.adminUser.create({
      data: { username, displayName: body.data.displayName, passwordHash: await hashPassword(temp), mustChangePassword: true, createdBy: me.username },
    });
    await auditAdmin({ action: "admin.user.create", actor: me.username, sessionId: me.sid, target: user.username, ip: clientIp(request.headers) });
    return NextResponse.json({ ok: true, user: { id: user.id, username: user.username }, temporaryPassword: temp });
  } catch (error) {
    if (isUniqueViolation(error, "username")) return NextResponse.json({ error: "Cet identifiant existe déjà." }, { status: 409 });
    console.error("[admin] création de compte impossible", error);
    return NextResponse.json({ error: "Création impossible pour le moment." }, { status: 500 });
  }
}
