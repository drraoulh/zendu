import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";
import { publicTransfer } from "@/lib/bank";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/me/transfers → transferts du client (100 derniers), avec événements. */
export async function GET(request: Request) {
  const authed = await requireCustomer(request);
  if (authed instanceof NextResponse) return authed;
  const transfers = await prisma.transfer.findMany({
    where: { customerId: authed.customer.id },
    include: { beneficiary: true, events: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(transfers.map(publicTransfer));
}
