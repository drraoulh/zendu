import { NextResponse } from "next/server";
import { markPaymentDetected } from "@/lib/transfer-service";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/** Demo endpoint: simulate Canada pay-in success (mock provider). */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const transfer = await prisma.transfer.findUnique({ where: { id } });

  if (!transfer) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  if (transfer.status !== "awaiting_payment") {
    return NextResponse.json(
      { error: `Statut actuel: ${transfer.status}` },
      { status: 400 },
    );
  }

  try {
    const updated = await markPaymentDetected(
      id,
      transfer.payInRef ?? `demo_pay_${id}`,
    );
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur paiement";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
