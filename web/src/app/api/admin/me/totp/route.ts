import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auditAdmin, clientIp, requireAdminIdentity } from "@/lib/admin-guard";
import { newTotpSecret, openSecret, sealSecret, totpUri, verifyTotp } from "@/lib/admin-totp";
import { verifyPassword } from "@/lib/admin-users";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start") }),
  z.object({ action: z.literal("confirm"), enroll: z.string().max(500), code: z.string().max(10) }),
  z.object({ action: z.literal("disable"), password: z.string().max(200), code: z.string().max(10) }),
]);

/**
 * Code à 6 chiffres du compte connecté.
 * - start : nouveau secret (QR code + clé), renvoyé chiffré dans `enroll` (rien n'est enregistré).
 * - confirm : le premier code saisi prouve que l'application est bien configurée → enregistré.
 * - disable : mot de passe + code actuel.
 */
export async function POST(request: Request) {
  const me = await requireAdminIdentity(request);
  if (me instanceof NextResponse) return me;
  if (!me.userId) return NextResponse.json({ error: "Compte provisoire : créez d'abord votre compte personnel (Sécurité)." }, { status: 400 });
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  const ip = clientIp(request.headers);

  if (body.data.action === "start") {
    const secret = newTotpSecret();
    const uri = totpUri(secret, me.username);
    const qr = await QRCode.toDataURL(uri, { margin: 1, width: 220 });
    return NextResponse.json({ secret, uri, qr, enroll: sealSecret(`enroll:${me.userId}:${Date.now()}:${secret}`) });
  }

  if (!(await rateLimit(`admin-totp:${me.userId}`, 8, 15 * 60 * 1000))) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez dans 15 minutes." }, { status: 429 });
  }

  if (body.data.action === "confirm") {
    const opened = openSecret(body.data.enroll)?.split(":");
    const [tag, uid, at, secret] = opened ?? [];
    if (tag !== "enroll" || uid !== me.userId || !secret || Date.now() - Number(at) > 15 * 60_000) {
      return NextResponse.json({ error: "Activation expirée : recommencez." }, { status: 400 });
    }
    const step = verifyTotp(secret, body.data.code);
    if (step === null) return NextResponse.json({ error: "Code incorrect. Vérifiez l'heure du téléphone et réessayez." }, { status: 400 });
    await prisma.adminUser.update({ where: { id: me.userId }, data: { totpSecretEnc: sealSecret(secret), totpLastStep: step } });
    await auditAdmin({ action: "admin.totp.enable", actor: me.username, sessionId: me.sid, ip });
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.adminUser.findUnique({ where: { id: me.userId } });
  const secret = user?.totpSecretEnc ? openSecret(user.totpSecretEnc) : null;
  const passOk = user ? await verifyPassword(body.data.password, user.passwordHash) : false;
  if (!user || !secret || !passOk || verifyTotp(secret, body.data.code) === null) {
    await auditAdmin({ action: "admin.totp.disable", actor: me.username, sessionId: me.sid, ok: false, ip });
    return NextResponse.json({ error: "Mot de passe ou code incorrect." }, { status: 400 });
  }
  await prisma.adminUser.update({ where: { id: user.id }, data: { totpSecretEnc: null, totpLastStep: null } });
  await auditAdmin({ action: "admin.totp.disable", actor: me.username, sessionId: me.sid, ip });
  return NextResponse.json({ ok: true });
}
