import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emailSchema } from "@/lib/customer-input";
import { emailVerificationRequired, sendEmailCode } from "@/lib/email-verify";
import { OtpDeliveryError } from "@/lib/otp-delivery";
import { clientIp, isDbUnavailable } from "@/lib/requests";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({ email: emailSchema, firstName: z.string().trim().min(1).max(60).default("client"), challengeId: z.string().trim().max(64).optional() });

/** POST /api/auth/signup/email-code { email, firstName?, challengeId? } → { challengeId, resendAfter, required }. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Adresse courriel invalide" }, { status: 400 });
  const { email, firstName, challengeId } = parsed.data;
  if (!(await rateLimit(`email-code:${clientIp(request)}`, 12)) || !(await rateLimit(`email-code-to:${email}`, 6))) {
    return NextResponse.json({ ok: false, code: "rate_limited", error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
  }
  try {
    // Courriel déjà inscrit : inutile d'envoyer un code (même réponse que l'inscription).
    if (await prisma.customer.findUnique({ where: { email }, select: { id: true } })) {
      return NextResponse.json({ ok: false, code: "email_taken", error: "Un compte existe déjà avec ce courriel. Connectez-vous." }, { status: 409 });
    }
    const r = await sendEmailCode(email, firstName, challengeId);
    if (r.ok) return NextResponse.json({ ok: true, challengeId: r.challengeId, resendAfter: r.resendAfter, required: emailVerificationRequired() });
    if (r.code === "resend_too_soon") {
      return NextResponse.json({ ok: false, code: r.code, retryAfter: r.retryAfter, error: `Patientez ${r.retryAfter ?? 30} s avant de demander un nouveau code.` }, { status: 429 });
    }
    if (r.code === "resend_limit") return NextResponse.json({ ok: false, code: r.code, error: "Nombre maximal d'envois atteint. Vérifiez votre courriel (et les indésirables)." }, { status: 429 });
    return NextResponse.json({ ok: false, code: "expired", error: "Ce code a expiré. Demandez-en un nouveau." }, { status: 410 });
  } catch (error) {
    if (error instanceof OtpDeliveryError) {
      return NextResponse.json({ ok: false, code: "email_unavailable", error: "Le courriel n'a pas pu être envoyé pour le moment.", required: emailVerificationRequired() }, { status: 503 });
    }
    if (isDbUnavailable(error)) return NextResponse.json({ ok: false, error: "Service momentanément indisponible." }, { status: 503 });
    console.error("[auth:email-code]", error);
    return NextResponse.json({ ok: false, error: "Envoi impossible." }, { status: 500 });
  }
}
