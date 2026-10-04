import { NextResponse } from "next/server";
import { hashPassword, passwordProblem, publicCustomer, requireCustomer, verifyPassword } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/me/password { current, next } → { customer }
 * Les autres sessions du client sont révoquées (« vous serez déconnecté de vos autres appareils »).
 */
export async function POST(request: Request) {
  const authed = await requireCustomer(request);
  if (authed instanceof NextResponse) return authed;
  const body = (await request.json().catch(() => ({}))) as { current?: unknown; next?: unknown };
  if (typeof body.current !== "string" || typeof body.next !== "string") {
    return NextResponse.json({ ok: false, error: "Données invalides" }, { status: 400 });
  }
  if (!(await verifyPassword(body.current, authed.customer.passwordHash))) {
    return NextResponse.json({ ok: false, error: "Mot de passe actuel incorrect." }, { status: 403 });
  }
  const weak = passwordProblem(body.next);
  if (weak) return NextResponse.json({ ok: false, error: weak }, { status: 400 });
  if (body.next === body.current) return NextResponse.json({ ok: false, error: "Choisissez un mot de passe différent de l'actuel." }, { status: 400 });
  const [customer] = await prisma.$transaction([
    prisma.customer.update({
      where: { id: authed.customer.id },
      data: { passwordHash: await hashPassword(body.next), passwordChangedAt: new Date(), mustChangePassword: false },
    }),
    prisma.customerSession.updateMany({
      where: { customerId: authed.customer.id, revokedAt: null, NOT: { id: authed.session.id } },
      data: { revokedAt: new Date() },
    }),
  ]);
  return NextResponse.json({ customer: publicCustomer(customer) });
}
