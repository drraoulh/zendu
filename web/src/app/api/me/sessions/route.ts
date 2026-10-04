import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/me/sessions → appareils connectés (sessions actives). DELETE → déconnecte tous les autres. */
export async function GET(request: Request) {
  const authed = await requireCustomer(request);
  if (authed instanceof NextResponse) return authed;
  const sessions = await prisma.customerSession.findMany({
    where: { customerId: authed.customer.id, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastUsedAt: "desc" },
  });
  return NextResponse.json(
    sessions.map((s) => ({
      id: s.id,
      device: s.device,
      createdAt: s.createdAt.toISOString(),
      lastUsedAt: s.lastUsedAt.toISOString(),
      current: s.id === authed.session.id,
    })),
  );
}

export async function DELETE(request: Request) {
  const authed = await requireCustomer(request);
  if (authed instanceof NextResponse) return authed;
  const { count } = await prisma.customerSession.updateMany({
    where: { customerId: authed.customer.id, revokedAt: null, NOT: { id: authed.session.id } },
    data: { revokedAt: new Date() },
  });
  return NextResponse.json({ ok: true, revoked: count });
}
