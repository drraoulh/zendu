import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { isExpoPushToken, pushLang } from "@/lib/push";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  token: z.string().trim().max(200),
  platform: z.enum(["ios", "android"]),
  lang: z.string().max(5).optional(),
});

/**
 * POST /api/me/push-token { token, platform, lang } — l'appareil reçoit les notifications de ce compte.
 * Un même téléphone passé à un autre compte change de propriétaire (jamais deux comptes par jeton).
 * DELETE /api/me/push-token { token } — déconnexion : l'appareil cesse de recevoir les notifications.
 */
export async function POST(request: Request) {
  const authed = await requireCustomer(request);
  if (authed instanceof NextResponse) return authed;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isExpoPushToken(parsed.data.token)) {
    return NextResponse.json({ error: "Jeton de notification invalide" }, { status: 400 });
  }
  const { token, platform, lang } = parsed.data;
  const data = { customerId: authed.customer.id, platform, lang: pushLang(lang), disabledAt: null };
  await prisma.pushToken.upsert({ where: { token }, create: { token, ...data }, update: data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const authed = await requireCustomer(request);
  if (authed instanceof NextResponse) return authed;
  const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
  const token = typeof body?.token === "string" ? body.token.slice(0, 200) : null;
  if (token) await prisma.pushToken.deleteMany({ where: { token, customerId: authed.customer.id } });
  return NextResponse.json({ ok: true });
}
