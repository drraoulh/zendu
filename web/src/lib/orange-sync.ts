import { prisma } from "@/lib/prisma";
import { ORANGE_FAILED, orangeCashinStatus, orangeConfigured, orangeFailureReason } from "@/lib/providers/orange";
import { assertTransition } from "@/lib/transfer-machine";
import { notifyCustomer } from "@/lib/transfer-notify";

/**
 * Met à jour un versement Orange Money « en attente » à partir du statut lu chez Orange
 * (GET /cashin/paymentstatus/{payToken}). C'est cette réponse qui fait foi, jamais le contenu d'une
 * notification reçue. Sans effet si le transfert n'est plus en attente (appel en double, idempotent).
 */
// Lecture du suivi : au plus une question à Orange toutes les 20 s par transfert (l'appli rafraîchit souvent).
const lastCheck = new Map<string, number>();

export async function syncOrangePayout(transferId: string, source: "notification" | "lecture"): Promise<void> {
  if (!orangeConfigured()) return;
  if (source === "lecture") {
    const last = lastCheck.get(transferId) ?? 0;
    if (Date.now() - last < 20_000) return;
    lastCheck.set(transferId, Date.now());
    if (lastCheck.size > 5000) lastCheck.clear();
  }
  const transfer = await prisma.transfer.findUnique({ where: { id: transferId } });
  if (!transfer || transfer.payoutProvider !== "orange" || !transfer.payoutRef) return;
  if (transfer.status !== "payout_sent") return;

  const st = await orangeCashinStatus(transfer.payoutRef);
  if (st.status === "SUCCESSFULL") {
    assertTransition("payout_sent", "delivered");
    const done = await prisma.transfer.updateMany({
      where: { id: transfer.id, status: "payout_sent" },
      data: { status: "delivered", deliveredAt: new Date() },
    });
    if (!done.count) return;
    await prisma.transferEvent.create({
      data: { transferId: transfer.id, type: "delivered", message: `Livré (confirmé par Orange Money ${st.txnid ?? ""}, ${source})`.replace(" ,", ",") },
    });
    await notifyCustomer(transfer.id, "delivered");
  } else if (st.status && ORANGE_FAILED.has(st.status)) {
    const reason = orangeFailureReason(st);
    assertTransition("payout_sent", "payout_failed");
    const done = await prisma.transfer.updateMany({
      where: { id: transfer.id, status: "payout_sent" },
      data: { status: "payout_failed", failureReason: reason },
    });
    if (!done.count) return;
    await prisma.transferEvent.create({
      data: { transferId: transfer.id, type: "payout_failed", message: `Échec Orange Money : ${reason}` },
    });
    await notifyCustomer(transfer.id, "payout_failed");
  }
}
