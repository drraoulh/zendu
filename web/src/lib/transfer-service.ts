import { prisma } from "@/lib/prisma";
import { assertTransition } from "@/lib/transfer-machine";
import { payoutProviderFor } from "@/lib/providers/payout";
import { mockMomo } from "@/lib/providers/mock-momo";
import { createMomoPayout } from "@/lib/providers/momo";
import { mockBank } from "@/lib/providers/mock-bank";
import { isBankNetwork, isManualPayoutProvider, maskAccount } from "@/lib/bank";
import { INTERAC_PAYMENT_HOURS } from "@/lib/providers/interac";
import { NOTIFY_KINDS, notifyCustomer, type NotifyKind } from "@/lib/transfer-notify";

const WITH_EVENTS = {
  beneficiary: true,
  events: { orderBy: { createdAt: "asc" as const } },
};

async function addEvent(transferId: string, type: string, message: string) {
  await prisma.transferEvent.create({
    data: { transferId, type, message },
  });
  // Courriel au client aux étapes qui le concernent (paiement reçu, livré, échec…).
  if (NOTIFY_KINDS.includes(type)) await notifyCustomer(transferId, type as NotifyKind);
}

/**
 * Transferts jamais payés : passés « expiré » après INTERAC_PAYMENT_HOURS (24 h), comme annoncé au
 * client. Appelé à la lecture (listes, suivi, admin) et par la tâche planifiée /api/cron/expire.
 * Un virement reçu en retard peut encore être confirmé par l'équipe (expiré → paiement détecté).
 */
export async function expireStaleTransfers(where: { id?: string; customerId?: string } = {}) {
  const cutoff = new Date(Date.now() - INTERAC_PAYMENT_HOURS * 3600_000);
  const stale = await prisma.transfer.findMany({
    where: { ...where, status: "awaiting_payment", createdAt: { lt: cutoff } },
    select: { id: true },
    take: 200,
  });
  for (const { id } of stale) {
    const { count } = await prisma.transfer.updateMany({
      where: { id, status: "awaiting_payment" },
      data: { status: "expired", failureReason: "Paiement non reçu dans le délai" },
    });
    if (count) await addEvent(id, "expired", `Paiement non reçu sous ${INTERAC_PAYMENT_HOURS} h : transfert expiré`);
  }
  return stale.length;
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
  const route = payoutProviderFor(b.network, b.country);

  // Pas d'intégration réelle pour ce réseau (virement bancaire, Orange Money, Alipay, WeChat Pay,
  // Interac…) alors que les versements réels sont actifs : le transfert reste « payout_queued » et un
  // opérateur le verse puis le clôture (voir completeManualBankPayout). Jamais de simulation ici.
  if (isManualPayoutProvider(route)) {
    if (current.payoutProvider !== route) {
      await prisma.transfer.update({ where: { id: transferId }, data: { payoutProvider: route } });
    }
    const already = await prisma.transferEvent.findFirst({
      where: { transferId, type: { in: ["bank_manual", "payout_manual"] } },
    });
    if (!already) {
      await addEvent(
        transferId,
        bank ? "bank_manual" : "payout_manual",
        bank
          ? `Virement bancaire à traiter manuellement — ${b.bankName ?? "banque"} ${maskAccount(b.accountNumber) ?? ""}`.trim()
          : `Versement ${b.network} à faire par l'équipe`,
      );
    }
    return prisma.transfer.findUnique({ where: { id: transferId }, include: WITH_EVENTS });
  }

  assertTransition(current.status, "payout_sent");
  await prisma.transfer.update({
    where: { id: transferId },
    data: { status: "payout_sent", payoutProvider: route },
  });
  await addEvent(
    transferId,
    "payout_sent",
    route === "momo" ? "Appel disbursement MTN MoMo" : bank ? "Virement bancaire simulé (mode démo)" : "Versement simulé (mode démo)",
  );

  const provider = route === "momo" ? createMomoPayout() : bank ? mockBank : mockMomo;

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
  if (!isManualPayoutProvider(transfer.payoutProvider)) {
    throw new Error("Ce versement n'est pas en traitement manuel");
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
