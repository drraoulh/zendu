import { NextResponse } from "next/server";
import { resendLoginChallenge } from "@/lib/otp";
import { OtpDeliveryError } from "@/lib/otp-delivery";
import { clientIp, isDbUnavailable, rateLimit } from "@/lib/requests";

export const dynamic = "force-dynamic";

/** POST /api/auth/resend-2fa { challengeId, channel?: "sms" | "email" } → nouveau code (même défi). */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { challengeId?: unknown; channel?: unknown };
  const challengeId = typeof body.challengeId === "string" ? body.challengeId.trim() : "";
  if (!challengeId || challengeId.length > 64) return NextResponse.json({ ok: false, code: "invalid_request", error: "Requête invalide" }, { status: 400 });
  if (!rateLimit(`2fa-resend:${clientIp(request)}`, 15)) {
    return NextResponse.json({ ok: false, code: "rate_limited", error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
  }
  try {
    const channel = body.channel === "email" ? "email" : body.channel === "sms" ? "sms" : undefined;
    const result = await resendLoginChallenge(challengeId, channel);
    if (result.ok) return NextResponse.json({ ok: true, ...result.info, demo: Boolean(result.info.demoCode) });
    if (result.code === "resend_too_soon") {
      return NextResponse.json(
        { ok: false, code: result.code, retryAfter: result.retryAfter, error: `Patientez ${result.retryAfter ?? 30} s avant de demander un nouveau code.` },
        { status: 429 },
      );
    }
    if (result.code === "resend_limit") {
      return NextResponse.json({ ok: false, code: result.code, error: "Nombre maximal d'envois atteint. Reconnectez-vous pour recommencer." }, { status: 429 });
    }
    return NextResponse.json({ ok: false, code: result.code, error: "Ce code a expiré. Reconnectez-vous pour en recevoir un nouveau." }, { status: 410 });
  } catch (error) {
    if (error instanceof OtpDeliveryError) return NextResponse.json({ ok: false, code: error.code, error: error.message }, { status: 503 });
    if (isDbUnavailable(error)) return NextResponse.json({ ok: false, error: "Service momentanément indisponible." }, { status: 503 });
    console.error("[auth:resend-2fa]", error);
    return NextResponse.json({ ok: false, error: "Envoi impossible." }, { status: 500 });
  }
}
