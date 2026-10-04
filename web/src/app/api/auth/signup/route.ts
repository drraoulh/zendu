import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, hashPassword, passwordProblem, publicCustomer } from "@/lib/customer-auth";
import { signupSchema } from "@/lib/customer-input";
import { prisma } from "@/lib/prisma";
import { clientIp, isDbUnavailable, isUniqueViolation, rateLimit, zodIssues } from "@/lib/requests";

export const dynamic = "force-dynamic";

/** POST /api/auth/signup → 201 { token, customer } · 409 courriel déjà utilisé. */
export async function POST(request: Request) {
  if (!rateLimit(`signup:${clientIp(request)}`, 10)) {
    return NextResponse.json({ ok: false, code: "rate_limited", error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  }
  try {
    const data = signupSchema.parse(await request.json());
    const weak = passwordProblem(data.password);
    if (weak) return NextResponse.json({ ok: false, error: weak }, { status: 400 });
    const { password, device, ...profile } = data;
    const customer = await prisma.customer.create({
      data: { ...profile, passwordHash: await hashPassword(password), passwordChangedAt: new Date() },
    });
    const { token } = await createSession(customer.id, device);
    return NextResponse.json({ ok: true, token, customer: publicCustomer(customer) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ ok: false, error: "Données invalides", issues: zodIssues(error) }, { status: 400 });
    if (isUniqueViolation(error, "email")) {
      return NextResponse.json({ ok: false, code: "email_taken", error: "Un compte existe déjà avec ce courriel. Connectez-vous." }, { status: 409 });
    }
    if (isDbUnavailable(error)) return NextResponse.json({ ok: false, error: "Service momentanément indisponible." }, { status: 503 });
    console.error("[auth:signup]", error);
    return NextResponse.json({ ok: false, error: "Création du compte impossible." }, { status: 500 });
  }
}
