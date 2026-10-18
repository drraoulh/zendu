import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { momoGetTransferStatus } from "@/lib/providers/momo";
import { assertTransition } from "@/lib/transfer-machine";

/**
 * Rappel MTN MoMo Disbursement (X-Callback-Url).
 *
 * MTN ne signe pas ses rappels : le contenu reçu n'est donc JAMAIS cru tel quel (sinon n'importe qui
 * pourrait marquer un transfert « livré »). On ne retient que la référence, puis on redemande le statut
 * à l'API MTN avec nos identifiants (GET /v1_0/transfer/{referenceId}) et c'est cette réponse qui fait foi.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { externalId?: string } | null;
  const reference = typeof body?.externalId === "string" ? body.externalId.slice(0, 64) : "";
  if (!reference) return NextResponse.json({ error: "externalId manquant" }, { status: 400 });

  const transfer = await prisma.transfer.findFirst({ where: { reference } });
  // Réponse identique dans tous les cas : le rappel ne révèle pas quelles références existent.
  if (!transfer || transfer.payoutProvider !== "momo" || !transfer.payoutRef) {
    return NextResponse.json({ received: true });
  }
  if (transfer.status !== "payout_sent" && transfer.status !== "payout_queued") {
    return NextResponse.json({ received: true });
  }

  let status: Awaited<ReturnType<typeof momoGetTransferStatus>>;
  try {
    status = await momoGetTransferStatus(transfer.payoutRef);
  } catch (error) {
    console.error("[momo] statut introuvable après rappel", transfer.reference, error instanceof Error ? error.message : error);
    return NextResponse.json({ received: true });
  }

  await prisma.transferEvent.create({
    data: {
      transferId: transfer.id,
      type: "momo_callback",
      message: `Statut MTN vérifié : ${status.status}${status.financialTransactionId ? ` ${status.financialTransactionId}` : ""}`,
    },
  });

  try {
    if (status.status === "SUCCESSFUL") {
      if (transfer.status === "payout_queued") {
        assertTransition("payout_queued", "payout_sent");
      }
      assertTransition("payout_sent", "delivered");
      await prisma.transfer.update({
        where: { id: transfer.id },
        data: { status: "delivered", deliveredAt: new Date() },
      });
      await prisma.transferEvent.create({
        data: { transferId: transfer.id, type: "delivered", message: "Livré (confirmé par MTN MoMo)" },
      });
    } else if (status.status === "FAILED") {
      const reason = status.reason?.message ?? status.reason?.code ?? "Échec MTN MoMo";
      assertTransition(transfer.status === "payout_queued" ? "payout_queued" : "payout_sent", "payout_failed");
      await prisma.transfer.update({
        where: { id: transfer.id },
        data: { status: "payout_failed", failureReason: reason },
      });
      await prisma.transferEvent.create({
        data: { transferId: transfer.id, type: "payout_failed", message: `Échec MTN MoMo : ${reason}` },
      });
    }
  } catch {
    // Transition déjà faite (rappel en double) : rien à faire.
  }

  return NextResponse.json({ received: true });
}
