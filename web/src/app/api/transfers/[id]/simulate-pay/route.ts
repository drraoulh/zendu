import { NextResponse } from "next/server";
import { markPaymentDetected } from "@/lib/transfer-service";
import { prisma } from "@/lib/prisma";
import { publicTransfer } from "@/lib/bank";
import { INTERAC_PROVIDER, interacSimulationAllowed } from "@/lib/providers/interac";

type Params = { params: Promise<{ id: string }> };

/** Demo endpoint: simulate Canada pay-in success (mock provider). */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const transfer = await prisma.transfer.findUnique({ where: { id } });

  if (!transfer) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  // Réservé au mode démo : un vrai paiement n'est confirmé que par son webhook (carte) ou par l'équipe
  // (Interac, dès qu'une vraie adresse de dépôt est configurée).
  const demoInterac = transfer.payInProvider === INTERAC_PROVIDER && interacSimulationAllowed();
  if (transfer.payInProvider !== "mock" && !demoInterac) {
    return NextResponse.json({ error: "Simulation indisponible" }, { status: 403 });
  }

  if (transfer.status !== "awaiting_payment") {
    return NextResponse.json(
      { error: "Ce transfert n'est plus en attente de paiement.", code: "not_awaiting_payment", status: transfer.status },
      { status: 400 },
    );
  }

  try {
    const updated = await markPaymentDetected(
      id,
      transfer.payInRef ?? `demo_pay_${id}`,
    );
    return NextResponse.json(updated ? publicTransfer(updated) : updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur paiement";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
