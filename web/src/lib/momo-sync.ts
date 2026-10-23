import { prisma } from "@/lib/prisma";
import { getPayoutMode } from "@/lib/providers/payout";
import { momoGetTransferStatus } from "@/lib/providers/momo";
import { assertTransition } from "@/lib/transfer-machine";
import { notifyCustomer } from "@/lib/transfer-notify";

// Lecture du suivi : au plus une question à MTN toutes les 20 s par transfert.
const lastCheck = new Map<string, number>();

/**
 * Versement MTN MoMo « en cours » (accepté, ou réponse ambiguë : délai dépassé, 5xx) : le statut est
 * relu chez MTN avec nos identifiants. Lui seul fait foi ; une relance n'est possible qu'après un
 * échec CONFIRMÉ par MTN, ce qui empêche tout double versement.
 */
export async function syncMomoPayout(transferId: string): Promise<void> {
  if (getPayoutMode() !== "momo") return;
  const last = lastCheck.get(transferId) ?? 0;
  if (Date.now() - last < 20_000) return;
  lastCheck.set(transferId, Date.now());
  if (lastCheck.size > 5000) lastCheck.clear();

  const transfer = await prisma.transfer.findUnique({ where: { id: transferId } });
  if (!transfer || transfer.payoutProvider !== "momo" || !transfer.payoutRef || transfer.status !== "payout_sent") return;

  const st = await momoGetTransferStatus(transfer.payoutRef);
  if (st.status === "SUCCESSFUL") {
    assertTransition("payout_sent", "delivered");
    const done = await prisma.transfer.updateMany({
      where: { id: transfer.id, status: "payout_sent" },
      data: { status: "delivered", deliveredAt: new Date() },
    });
    if (!done.count) return;
    await prisma.transferEvent.create({
      data: { transferId: transfer.id, type: "delivered", message: `Livré (confirmé par MTN MoMo ${st.financialTransactionId ?? ""})`.trim() },
    });
    await notifyCustomer(transfer.id, "delivered");
  } else if (st.status === "FAILED") {
    const reason = st.reason?.message ?? st.reason?.code ?? "Échec MTN MoMo";
    assertTransition("payout_sent", "payout_failed");
    const done = await prisma.transfer.updateMany({
      where: { id: transfer.id, status: "payout_sent" },
      data: { status: "payout_failed", failureReason: reason },
    });
    if (!done.count) return;
    await prisma.transferEvent.create({ data: { transferId: transfer.id, type: "payout_failed", message: `Échec MTN MoMo : ${reason}` } });
    await notifyCustomer(transfer.id, "payout_failed");
  }
}
