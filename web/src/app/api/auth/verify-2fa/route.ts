import { NextResponse } from "next/server";
import { createSession, publicCustomer } from "@/lib/customer-auth";
import { verifyLoginChallenge } from "@/lib/otp";
import { clientIp, isDbUnavailable, rateLimit } from "@/lib/requests";

export const dynamic = "force-dynamic";

const EXPIRED = "Ce code a expiré ou n'est plus valable. Reconnectez-vous pour en recevoir un nouveau.";

/**
 * POST /api/auth/verify-2fa { challengeId, code } — étape 2 sur 2 → { token, customer }.
 * 400 invalid_code { attemptsLeft } · 410 challenge_expired / too_many_attempts (recommencer la connexion).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { challengeId?: unknown; code?: unknown };
  const challengeId = typeof body.challengeId === "string" ? body.challengeId.trim() : "";
  const code = typeof body.code === "string" ? body.code.replace(/\s/g, "") : "";
  if (!challengeId || challengeId.length > 64 || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false, code: "invalid_request", error: "Saisissez les 6 chiffres du code." }, { status: 400 });
  }
  if (!rateLimit(`2fa:${clientIp(request)}`, 30)) {
    return NextResponse.json({ ok: false, code: "rate_limited", error: "Trop de tentatives. Réessayez dans une heure." }, { status: 429 });
  }
  try {
    const result = await verifyLoginChallenge(challengeId, code);
    if (!result.ok) {
      if (result.code === "invalid_code") {
        const left = result.attemptsLeft;
        return NextResponse.json(
          { ok: false, code: "invalid_code", attemptsLeft: left, error: `Code incorrect. ${left} essai${left > 1 ? "s" : ""} restant${left > 1 ? "s" : ""}.` },
          { status: 400 },
        );
      }
      if (result.code === "suspended") {
        return NextResponse.json({ ok: false, code: "suspended", error: "Ce compte est suspendu. Contactez le support." }, { status: 403 });
      }
      const error = result.code === "too_many_attempts" ? "Trop d'essais incorrects. Reconnectez-vous pour recevoir un nouveau code." : EXPIRED;
      return NextResponse.json({ ok: false, code: result.code, error }, { status: 410 });
    }
    const { token } = await createSession(result.customer.id, result.device);
    return NextResponse.json({ ok: true, token, customer: publicCustomer(result.customer) });
  } catch (error) {
    if (isDbUnavailable(error)) return NextResponse.json({ ok: false, error: "Service momentanément indisponible." }, { status: 503 });
    console.error("[auth:verify-2fa]", error);
    return NextResponse.json({ ok: false, error: "Vérification impossible." }, { status: 500 });
  }
}
