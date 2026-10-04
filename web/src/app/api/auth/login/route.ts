import { NextResponse } from "next/server";
import { createSession, publicCustomer, verifyPassword } from "@/lib/customer-auth";
import { emailSchema } from "@/lib/customer-input";
import { prisma } from "@/lib/prisma";
import { clientIp, isDbUnavailable, rateLimit } from "@/lib/requests";

export const dynamic = "force-dynamic";

const invalid = () => NextResponse.json({ ok: false, code: "invalid_credentials", error: "Courriel ou mot de passe incorrect." }, { status: 401 });

/** POST /api/auth/login { email, password, device? } → { token, customer } */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: unknown; password?: unknown; device?: unknown };
  const email = emailSchema.safeParse(body.email);
  if (!email.success || typeof body.password !== "string" || !body.password) return invalid();
  if (!rateLimit(`login:${clientIp(request)}`, 20) || !rateLimit(`login:${email.data}`, 10)) {
    return NextResponse.json({ ok: false, code: "rate_limited", error: "Trop de tentatives. Réessayez dans une heure." }, { status: 429 });
  }
  try {
    const customer = await prisma.customer.findUnique({ where: { email: email.data } });
    if (!customer || !(await verifyPassword(body.password, customer.passwordHash))) return invalid();
    if (customer.status !== "active") {
      return NextResponse.json({ ok: false, code: "suspended", error: "Ce compte est suspendu. Contactez le support." }, { status: 403 });
    }
    const { token } = await createSession(customer.id, typeof body.device === "string" ? body.device : null);
    return NextResponse.json({ ok: true, token, customer: publicCustomer(customer) });
  } catch (error) {
    if (isDbUnavailable(error)) return NextResponse.json({ ok: false, error: "Service momentanément indisponible." }, { status: 503 });
    console.error("[auth:login]", error);
    return NextResponse.json({ ok: false, error: "Connexion impossible." }, { status: 500 });
  }
}
