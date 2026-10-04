import { prisma } from "@/lib/prisma";
import { assertTransition } from "@/lib/transfer-machine";
import { getPayoutMode } from "@/lib/providers/payout";
import { mockMomo } from "@/lib/providers/mock-momo";
import { createMomoPayout } from "@/lib/providers/momo";
import { mockBank } from "@/lib/providers/mock-bank";
import { isBankNetwork, MANUAL_BANK_PROVIDER, maskAccount, MOCK_BANK_PROVIDER } from "@/lib/bank";

const WITH_EVENTS = {
  beneficiary: true,
  events: { orderBy: { createdAt: "asc" as const } },
};

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

  const b = current.beneficiary;
  const bank = isBankNetwork(b.network, b.country);

  // MTN MoMo ne sait pas payer un compte bancaire : en mode réel, le virement reste
  // « payout_queued » et un opérateur le réalise puis le clôture (voir completeManualBankPayout).
  if (bank && getPayoutMode() === "momo") {
    if (current.payoutProvider !== MANUAL_BANK_PROVIDER) {
      await prisma.transfer.update({
        where: { id: transferId },
        data: { payoutProvider: MANUAL_BANK_PROVIDER },
      });
    }
    const already = await prisma.transferEvent.findFirst({
      where: { transferId, type: "bank_manual" },
    });
    if (!already) {
      await addEvent(
        transferId,
        "bank_manual",
        `Virement bancaire à traiter manuellement — ${b.bankName ?? "banque"} ${maskAccount(b.accountNumber) ?? ""}`.trim(),
      );
    }
    return prisma.transfer.findUnique({ where: { id: transferId }, include: WITH_EVENTS });
  }

  assertTransition(current.status, "payout_sent");
  await prisma.transfer.update({
    where: { id: transferId },
    data: {
      status: "payout_sent",
      payoutProvider: bank ? MOCK_BANK_PROVIDER : getPayoutMode(),
    },
  });
  await addEvent(
    transferId,
    "payout_sent",
    bank ? "Virement bancaire simulé (mode démo)" : "Appel disbursement MoMo",
  );

  const provider = bank ? mockBank : getPayoutMode() === "momo" ? createMomoPayout() : mockMomo;

  try {
    const result = await provider.disburse({
      transferId,
      reference: current.reference,
      amountXaf: current.receiveAmountXaf,
      phone: b.phone,
      fullName: b.fullName,
      bank:
        bank && b.accountNumber
          ? { bankName: b.bankName ?? "", accountNumber: b.accountNumber, bankCode: b.bankCode }
          : undefined,
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

/**
 * Clôture par un opérateur d'un virement bancaire traité manuellement
 * (payoutProvider "manual_bank", statut "payout_queued").
 */
export async function completeManualBankPayout(
  transferId: string,
  input: { outcome: "delivered" | "failed"; bankReference?: string; reason?: string },
) {
  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    include: { beneficiary: true },
  });
  if (!transfer) throw new Error("Transfert introuvable");
  if (!isBankNetwork(transfer.beneficiary.network, transfer.beneficiary.country)) {
    throw new Error("Ce transfert n'est pas un virement bancaire");
  }
  if (transfer.payoutProvider !== MANUAL_BANK_PROVIDER) {
    throw new Error("Ce virement n'est pas en traitement manuel");
  }
  if (transfer.status !== "payout_queued" && transfer.status !== "payout_sent") {
    throw new Error("Ce virement a déjà été traité ou n'est pas encore payé.");
  }

  const ref = input.bankReference?.trim() || null;

  if (input.outcome === "failed") {
    assertTransition(transfer.status, "payout_failed");
    const reason = input.reason?.trim() || "Virement bancaire refusé";
    await prisma.transfer.update({
      where: { id: transferId },
      data: { status: "payout_failed", failureReason: reason, payoutRef: ref ?? transfer.payoutRef },
    });
    await addEvent(transferId, "payout_failed", reason);
  } else {
    if (transfer.status === "payout_queued") {
      assertTransition(transfer.status, "payout_sent");
      await prisma.transfer.update({
        where: { id: transferId },
        data: { status: "payout_sent", payoutRef: ref ?? transfer.payoutRef },
      });
      await addEvent(transferId, "payout_sent", `Virement bancaire émis par un opérateur${ref ? ` (${ref})` : ""}`);
    }
    assertTransition("payout_sent", "delivered");
    await prisma.transfer.update({
      where: { id: transferId },
      data: { status: "delivered", deliveredAt: new Date(), payoutRef: ref ?? transfer.payoutRef },
    });
    await addEvent(transferId, "delivered", "Virement bancaire confirmé par un opérateur");
  }

  return prisma.transfer.findUnique({ where: { id: transferId }, include: WITH_EVENTS });
}
