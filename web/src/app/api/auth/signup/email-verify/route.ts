import { NextResponse } from "next/server";
import { z } from "zod";
import { checkEmailCode } from "@/lib/email-verify";
import { clientIp, isDbUnavailable } from "@/lib/requests";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({ challengeId: z.string().trim().min(8).max(64), code: z.string().trim().min(4).max(12) });

/** POST /api/auth/signup/email-verify { challengeId, code } → { ok: true } : le défi sert ensuite de preuve à l'inscription. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Code invalide" }, { status: 400 });
  if (!(await rateLimit(`email-verify:${clientIp(request)}`, 30))) {
    return NextResponse.json({ ok: false, code: "rate_limited", error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  }
  try {
    const r = await checkEmailCode(parsed.data.challengeId, parsed.data.code);
    if (r.ok) return NextResponse.json({ ok: true });
    if (r.code === "wrong_code") return NextResponse.json({ ok: false, code: r.code, left: r.left, error: "Code incorrect." }, { status: 400 });
    if (r.code === "too_many") return NextResponse.json({ ok: false, code: r.code, error: "Trop d'essais. Demandez un nouveau code." }, { status: 429 });
    return NextResponse.json({ ok: false, code: "expired", error: "Ce code a expiré. Demandez-en un nouveau." }, { status: 410 });
  } catch (error) {
    if (isDbUnavailable(error)) return NextResponse.json({ ok: false, error: "Service momentanément indisponible." }, { status: 503 });
    console.error("[auth:email-verify]", error);
    return NextResponse.json({ ok: false, error: "Vérification impossible." }, { status: 500 });
  }
}
