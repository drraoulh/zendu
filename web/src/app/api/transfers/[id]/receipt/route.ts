import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getReceiptByTransferId } from "@/lib/receipt";
import { maskEmail, maskName, maskPhone, notFound, transferAccess } from "../_access";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** GET /api/transfers/[id]/receipt — mêmes droits que GET /api/transfers/[id] (coordonnées masquées en accès public). */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const owner = await prisma.transfer.findUnique({ where: { id }, select: { customerId: true } });
  if (!owner) return NextResponse.json({ error: "Reçu introuvable" }, { status: 404 });
  const access = await transferAccess(request, owner);
  if (access instanceof NextResponse) return access;

  const receipt = await getReceiptByTransferId(id);
  if (!receipt) return notFound();
  if (access === "full") return NextResponse.json(receipt);
  return NextResponse.json({
    ...receipt,
    sender: { name: maskName(receipt.sender.name), email: maskEmail(receipt.sender.email) },
    recipient: { ...receipt.recipient, name: maskName(receipt.recipient.name), phone: maskPhone(receipt.recipient.phone), bankCode: null },
    payoutRef: null,
    limited: true,
  });
}
