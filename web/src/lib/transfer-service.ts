import { prisma } from "@/lib/prisma";
import { assertTransition } from "@/lib/transfer-machine";
import { getPayoutMode } from "@/lib/providers/payout";
import { mockMomo } from "@/lib/providers/mock-momo";
import { createMomoPayout } from "@/lib/providers/momo";

async function addEvent(transferId: string, type: string, message: string) {
  await prisma.transferEvent.create({
    data: { transferId, type, message },
  });
}

export async function markPaymentDetected(transferId: string, payInRef: string) {
  const transfer = await prisma.transfer.findUnique({ where: { id: transferId } });
  if (!transfer) throw new Error("Transfert introuvable");

  assertTransition(transfer.status, "payment_detected");

  await prisma.transfer.update({
    where: { id: transferId },
    data: {
      status: "payment_detected",
      payInRef,
      paidAt: new Date(),
    },
  });
  await addEvent(transferId, "payment_detected", `Paiement détecté (${payInRef})`);

  if (process.env.AUTO_PAYOUT !== "false") {
    return queueAndRunPayout(transferId);
  }

  return prisma.transfer.findUnique({
    where: { id: transferId },
    include: { beneficiary: true, events: { orderBy: { createdAt: "asc" } } },
  });
}

export async function queueAndRunPayout(transferId: string) {
  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    include: { beneficiary: true },
  });
  if (!transfer) throw new Error("Transfert introuvable");

  if (transfer.status === "payment_detected") {
    assertTransition(transfer.status, "payout_queued");
    await prisma.transfer.update({
      where: { id: transferId },
      data: { status: "payout_queued" },
    });
    await addEvent(transferId, "payout_queued", "Payout mis en file");
  }

  const current = await prisma.transfer.findUnique({
    where: { id: transferId },
    include: { beneficiary: true },
  });
  if (!current) throw new Error("Transfert introuvable");
  if (current.status !== "payout_queued") {
    return current;
  }

  assertTransition(current.status, "payout_sent");
  await prisma.transfer.update({
    where: { id: transferId },
    data: { status: "payout_sent", payoutProvider: getPayoutMode() },
  });
  await addEvent(transferId, "payout_sent", "Appel disbursement MoMo");

  const provider = getPayoutMode() === "momo" ? createMomoPayout() : mockMomo;

  try {
    const result = await provider.disburse({
      transferId,
      reference: current.reference,
      amountXaf: current.receiveAmountXaf,
      phone: current.beneficiary.phone,
      fullName: current.beneficiary.fullName,
    });

    if (result.status === "failed") {
      assertTransition("payout_sent", "payout_failed");
      await prisma.transfer.update({
        where: { id: transferId },
        data: {
          status: "payout_failed",
          payoutRef: result.payoutRef,
          failureReason: result.message,
        },
      });
      await addEvent(transferId, "payout_failed", result.message ?? "Échec payout");
    } else if (result.status === "delivered") {
      assertTransition("payout_sent", "delivered");
      await prisma.transfer.update({
        where: { id: transferId },
        data: {
          status: "delivered",
          payoutRef: result.payoutRef,
          deliveredAt: new Date(),
        },
      });
      await addEvent(transferId, "delivered", result.message ?? "Livré au destinataire");
    } else {
      await prisma.transfer.update({
        where: { id: transferId },
        data: { payoutRef: result.payoutRef },
      });
      await addEvent(transferId, "payout_accepted", "Accepté par MoMo, en attente webhook");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur payout";
    await prisma.transfer.update({
      where: { id: transferId },
      data: { status: "payout_failed", failureReason: message },
    });
    await addEvent(transferId, "payout_failed", message);
  }

  return prisma.transfer.findUnique({
    where: { id: transferId },
    include: { beneficiary: true, events: { orderBy: { createdAt: "asc" } } },
  });
}
