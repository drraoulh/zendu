import { NextResponse } from "next/server";
import { checkLoginPassword } from "@/lib/customer-auth";
import { emailSchema } from "@/lib/customer-input";
import { createLoginChallenge, OtpRateLimitError } from "@/lib/otp";
import { OtpDeliveryError } from "@/lib/otp-delivery";
import { prisma } from "@/lib/prisma";
import { clientIp, isDbUnavailable, rateLimit } from "@/lib/requests";

export const dynamic = "force-dynamic";

const invalid = () => NextResponse.json({ ok: false, code: "invalid_credentials", error: "Courriel ou mot de passe incorrect." }, { status: 401 });

/**
 * POST /api/auth/login { email, password, device?, channel? } — étape 1 sur 2.
 * Mot de passe correct → { ok, twoFactorRequired: true, challengeId, channel, destination, expiresAt,
 * resendAfter, attemptsLeft, demoCode? } ; le jeton de session n'est délivré que par
 * POST /api/auth/verify-2fa. `demoCode` n'existe qu'en mode démo (voir src/lib/otp-delivery.ts).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: unknown; password?: unknown; device?: unknown; channel?: unknown };
  const email = emailSchema.safeParse(body.email);
  if (!email.success || typeof body.password !== "string" || !body.password || body.password.length > 200) return invalid();
  if (!rateLimit(`login:${clientIp(request)}`, 20) || !rateLimit(`login:${email.data}`, 10)) {
    return NextResponse.json({ ok: false, code: "rate_limited", error: "Trop de tentatives. Réessayez dans une heure." }, { status: 429 });
  }
  try {
    const customer = await prisma.customer.findUnique({ where: { email: email.data } });
    if (!(await checkLoginPassword(body.password, customer?.passwordHash)) || !customer) return invalid();
    if (customer.status !== "active") {
      return NextResponse.json({ ok: false, code: "suspended", error: "Ce compte est suspendu. Contactez le support." }, { status: 403 });
    }
    const challenge = await createLoginChallenge(customer, {
      channel: body.channel === "email" ? "email" : "sms",
      device: typeof body.device === "string" ? body.device : null,
      ip: clientIp(request),
    });
    return NextResponse.json({ ok: true, twoFactorRequired: true, ...challenge, demo: Boolean(challenge.demoCode) });
  } catch (error) {
    if (error instanceof OtpRateLimitError) return NextResponse.json({ ok: false, code: "rate_limited", error: error.message }, { status: 429 });
    if (error instanceof OtpDeliveryError) return NextResponse.json({ ok: false, code: error.code, error: error.message }, { status: 503 });
    if (isDbUnavailable(error)) return NextResponse.json({ ok: false, error: "Service momentanément indisponible." }, { status: 503 });
    console.error("[auth:login]", error);
    return NextResponse.json({ ok: false, error: "Connexion impossible." }, { status: 500 });
  }
}
