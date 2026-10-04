import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** DELETE /api/me/sessions/[id] → déconnecte cet appareil. */
export async function DELETE(request: Request, { params }: Params) {
  const authed = await requireCustomer(request);
  if (authed instanceof NextResponse) return authed;
  const { id } = await params;
  const { count } = await prisma.customerSession.updateMany({
    where: { id, customerId: authed.customer.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return count ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, error: "Introuvable" }, { status: 404 });
}
