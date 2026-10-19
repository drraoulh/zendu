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

  // Mise à jour conditionnelle : deux confirmations simultanées (double clic, webhook rejoué)
  // ne déclenchent jamais deux versements.
  const { count } = await prisma.transfer.updateMany({
    where: { id: transferId, status: transfer.status },
    data: {
      status: "payment_detected",
      payInRef,
      paidAt: new Date(),
    },
  });
  if (!count) throw new Error("Ce transfert vient d'être traité par ailleurs. Rechargez la page.");
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

  // Versement en échec relancé par l'équipe (payout_failed → payout_queued).
  if (transfer.status === "payment_detected" || transfer.status === "payout_failed") {
    assertTransition(transfer.status, "payout_queued");
    const { count } = await prisma.transfer.updateMany({
      where: { id: transferId, status: transfer.status },
      data: { status: "payout_queued", ...(transfer.status === "payout_failed" ? { failureReason: null } : {}) },
    });
    if (!count) throw new Error("Ce transfert vient d'être traité par ailleurs. Rechargez la page.");
    await addEvent(
      transferId,
      "payout_queued",
      transfer.status === "payout_failed" ? "Versement relancé par l'équipe" : "Payout mis en file",
    );
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
  // Un seul appel au fournisseur par transfert, même si deux requêtes arrivent en même temps.
  const claimed = await prisma.transfer.updateMany({
    where: { id: transferId, status: "payout_queued" },
    data: { status: "payout_sent", payoutProvider: route },
  });
  if (!claimed.count) return prisma.transfer.findUnique({ where: { id: transferId }, include: WITH_EVENTS });
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
    throw new Error("Ce versement a déjà été clôturé ou le paiement n'est pas encore confirmé. Rechargez la page.");
  }

  const ref = input.bankReference?.trim() || null;

  const bank = isBankNetwork(transfer.beneficiary.network, transfer.beneficiary.country);
  const what = bank ? "Virement bancaire" : `Versement ${transfer.beneficiary.network}`;
  // Mise à jour conditionnelle : un double clic ne clôture (et ne notifie) qu'une fois.
  const claim = async (data: { status: string; failureReason?: string; deliveredAt?: Date }) => {
    const { count } = await prisma.transfer.updateMany({
      where: { id: transferId, status: transfer.status },
      data: { ...data, payoutRef: ref ?? transfer.payoutRef },
    });
    if (!count) throw new Error("Ce versement vient d'être clôturé par ailleurs. Rechargez la page.");
  };

  if (input.outcome === "failed") {
    assertTransition(transfer.status, "payout_failed");
    const reason = input.reason?.trim() || (bank ? "Virement bancaire refusé" : "Versement impossible");
    await claim({ status: "payout_failed", failureReason: reason });
    await addEvent(transferId, "payout_failed", reason);
  } else {
    await claim({ status: "delivered", deliveredAt: new Date() });
    if (transfer.status === "payout_queued") {
      await addEvent(transferId, "payout_sent", `${what} effectué par un opérateur${ref ? ` (${ref})` : ""}`);
    }
    await addEvent(transferId, "delivered", `${what} confirmé par un opérateur`);
  }

  return prisma.transfer.findUnique({ where: { id: transferId }, include: WITH_EVENTS });
}


/** Statuts depuis lesquels l'équipe peut annuler un transfert (paiement absent, faux, ou versement impossible). */
const CANCELLABLE = ["awaiting_payment", "payment_mismatch", "payout_failed"] as const;

/**
 * Annulation par l'équipe (admin). Le remboursement Interac se fait depuis le compte de réception ;
 * `note` garde sa référence ou le motif. Atomique : un double clic n'annule qu'une fois.
 */
export async function cancelTransfer(transferId: string, note: string) {
  const reason = note.trim().slice(0, 300) || "Annulé par l'équipe";
  const { count } = await prisma.transfer.updateMany({
    where: { id: transferId, status: { in: [...CANCELLABLE] } },
    data: { status: "cancelled", failureReason: reason },
  });
  if (!count) {
    const t = await prisma.transfer.findUnique({ where: { id: transferId }, select: { status: true } });
    if (!t) throw new Error("Transfert introuvable");
    throw new Error(`Ce transfert ne peut pas être annulé (statut « ${t.status} »). Rechargez la page.`);
  }
  await addEvent(transferId, "cancelled", `Annulé par l'équipe — ${reason}`);
  return prisma.transfer.findUnique({ where: { id: transferId }, include: WITH_EVENTS });
}
