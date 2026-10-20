import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { MANUAL_BANK_PROVIDER, MANUAL_PAYOUT_PROVIDER, maskAccount } from "@/lib/bank";
import { INTERAC_PROVIDER } from "@/lib/providers/interac";
import { expireStaleTransfers } from "@/lib/transfer-service";

/* ------------------------------------------------------------------ Files de travail */

/** Virements Interac attendus, ou signalés envoyés par le client mais arrivés après l'expiration. */
function interacWhere(): Prisma.TransferWhereInput {
  return {
    OR: [
      { payInProvider: INTERAC_PROVIDER, status: "awaiting_payment" },
      {
        payInProvider: INTERAC_PROVIDER,
        status: "expired",
        createdAt: { gte: new Date(Date.now() - 7 * 86400_000) },
        events: { some: { type: "interac_declared" } },
      },
    ],
  };
}

function manualPayoutWhere(): Prisma.TransferWhereInput {
  return { payoutProvider: { in: [MANUAL_BANK_PROVIDER, MANUAL_PAYOUT_PROVIDER] }, status: { in: ["payout_queued", "payout_sent"] } };
}

/** Paiements non conformes et versements en échec récents. */
function issuesWhere(): Prisma.TransferWhereInput {
  return { status: { in: ["payment_mismatch", "payout_failed"] }, updatedAt: { gte: new Date(Date.now() - 30 * 86400_000) } };
}

/** Union des trois files : un dossier en attente ne doit jamais disparaître derrière des transferts plus récents. */
export function workQueueWhere(): Prisma.TransferWhereInput {
  return { OR: [interacWhere(), manualPayoutWhere(), issuesWhere()] };
}

export type ActionCounts = {
  interac: number | null;
  payouts: number | null;
  issues: number | null;
  kycPending: number | null;
  newRequests: number | null;
};

/**
 * Nombre de dossiers en attente d'une action de l'équipe. Une table absente donne `null`, jamais une erreur.
 * Mis en cache pour la requête : la mise en page et la vue d'ensemble le lisent toutes les deux.
 */
export const actionCounts = cache(async (): Promise<ActionCounts> => {
  await expireStaleTransfers().catch((err: unknown) => console.error("[admin] expiration impossible", err));
  const safe = (p: Promise<number>) => p.catch(() => null);
  const [interac, payouts, issues, kycPending, newRequests] = await Promise.all([
    safe(prisma.transfer.count({ where: interacWhere() })),
    safe(prisma.transfer.count({ where: manualPayoutWhere() })),
    safe(prisma.transfer.count({ where: issuesWhere() })),
    safe(prisma.customer.count({ where: { kycStatus: "pending" } })),
    safe(prisma.serviceRequest.count({ where: { status: "new" } })),
  ]);
  return { interac, payouts, issues, kycPending, newRequests };
});

/* ------------------------------------------------------------------ Activité */

export const INSIGHT_PERIODS = [7, 30, 90] as const;
export type InsightPeriod = (typeof INSIGHT_PERIODS)[number];

export function parsePeriod(raw: string | string[] | undefined): InsightPeriod {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return (INSIGHT_PERIODS as readonly number[]).includes(n) ? (n as InsightPeriod) : 30;
}

/** Fonds reçus du client (encaissement confirmé), que le versement soit fait ou non. */
const PAID_STATUSES = new Set(["payment_detected", "payout_queued", "payout_sent", "delivered"]);
const FAILED_STATUSES = new Set(["payout_failed", "payment_mismatch"]);

/** Jour calendaire de l'équipe (heure de l'Est), pour que « aujourd'hui » corresponde à Montréal / Toronto. */
const TEAM_TZ = "America/Toronto";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TEAM_TZ, year: "numeric", month: "2-digit", day: "2-digit" });

export type TransferInsights = {
  period: InsightPeriod;
  created: number;
  createdPrevious: number;
  delivered: number;
  /** Livrés / (livrés + échecs), sur les transferts créés dans la période ; null sans dossier conclu. */
  successRate: number | null;
  volume: Record<string, number>;
  fees: Record<string, number>;
  /** Une barre par jour (7 et 30 jours) ou par semaine (90 jours), du plus ancien au plus récent. */
  bucketDays: 1 | 7;
  series: { start: string; created: number; delivered: number }[];
  corridors: { source: string; dest: string; count: number }[];
};

export async function transferInsights(period: InsightPeriod): Promise<TransferInsights> {
  const now = Date.now();
  const start = new Date(now - period * 86400_000);
  const previousStart = new Date(now - 2 * period * 86400_000);

  const rows = await prisma.transfer.findMany({
    where: { createdAt: { gte: previousStart } },
    select: { createdAt: true, status: true, totalCad: true, feeCad: true, sendCurrency: true, sourceCountry: true, destCountry: true },
    orderBy: { createdAt: "asc" },
    take: 50_000,
  });

  const current = rows.filter((r) => r.createdAt >= start);
  const previous = rows.filter((r) => r.createdAt < start);

  const volume: Record<string, number> = {};
  const fees: Record<string, number> = {};
  let delivered = 0;
  let failed = 0;
  const corridorMap = new Map<string, { source: string; dest: string; count: number }>();
  for (const r of current) {
    if (PAID_STATUSES.has(r.status)) {
      volume[r.sendCurrency] = (volume[r.sendCurrency] ?? 0) + r.totalCad;
      fees[r.sendCurrency] = (fees[r.sendCurrency] ?? 0) + r.feeCad;
    }
    if (r.status === "delivered") delivered++;
    if (FAILED_STATUSES.has(r.status)) failed++;
    const key = `${r.sourceCountry}-${r.destCountry}`;
    const c = corridorMap.get(key) ?? { source: r.sourceCountry, dest: r.destCountry, count: 0 };
    c.count++;
    corridorMap.set(key, c);
  }

  const bucketDays: 1 | 7 = period > 30 ? 7 : 1;
  const bucketCount = Math.ceil(period / bucketDays);
  const series = Array.from({ length: bucketCount }, (_, i) => {
    // Le dernier seau se termine aujourd'hui.
    const offset = (bucketCount - 1 - i) * bucketDays + (bucketDays - 1);
    return { start: dayKey.format(new Date(now - offset * 86400_000)), created: 0, delivered: 0 };
  });
  const indexOfDay = new Map<string, number>();
  for (let b = 0; b < bucketCount; b++) {
    for (let d = 0; d < bucketDays; d++) {
      const offset = (bucketCount - 1 - b) * bucketDays + (bucketDays - 1) - d;
      indexOfDay.set(dayKey.format(new Date(now - offset * 86400_000)), b);
    }
  }
  for (const r of current) {
    const b = indexOfDay.get(dayKey.format(r.createdAt));
    if (b === undefined) continue;
    series[b].created++;
    if (r.status === "delivered") series[b].delivered++;
  }

  return {
    period,
    created: current.length,
    createdPrevious: previous.length,
    delivered,
    successRate: delivered + failed > 0 ? delivered / (delivered + failed) : null,
    volume,
    fees,
    bucketDays,
    series,
    corridors: [...corridorMap.values()].sort((a, b) => b.count - a.count).slice(0, 5),
  };
}

/* ------------------------------------------------------------------ Fiche transfert */

export type AdminTransferDetail = {
  id: string;
  reference: string;
  status: string;
  corridorId: string;
  sourceCountry: string;
  destCountry: string;
  sendCurrency: string;
  receiveCurrency: string;
  sendAmount: number;
  fee: number;
  total: number;
  rate: number;
  receiveAmount: number;
  senderName: string;
  senderEmail: string;
  customer: { id: string; name: string; kycStatus: string } | null;
  recipient: {
    fullName: string;
    phone: string;
    network: string;
    country: string;
    bankName: string | null;
    accountMasked: string | null;
    bankCode: string | null;
  };
  payInProvider: string;
  payInRef: string | null;
  payoutProvider: string;
  payoutRef: string | null;
  failureReason: string | null;
  inQueue: boolean;
  createdAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
  events: { id: string; type: string; message: string; createdAt: string }[];
};

export async function getAdminTransfer(reference: string): Promise<AdminTransferDetail | null> {
  const t = await prisma.transfer.findUnique({
    where: { reference },
    include: {
      beneficiary: true,
      customer: { select: { id: true, firstName: true, lastName: true, kycStatus: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!t) return null;
  const inQueue = (await prisma.transfer.count({ where: { AND: [{ id: t.id }, workQueueWhere()] } })) > 0;
  return {
    id: t.id,
    reference: t.reference,
    status: t.status,
    corridorId: t.corridorId,
    sourceCountry: t.sourceCountry,
    destCountry: t.destCountry,
    sendCurrency: t.sendCurrency,
    receiveCurrency: t.receiveCurrency,
    sendAmount: t.sendAmountCad,
    fee: t.feeCad,
    total: t.totalCad,
    rate: t.rate,
    receiveAmount: t.receiveAmountXaf,
    senderName: t.senderName,
    senderEmail: t.senderEmail,
    customer: t.customer
      ? { id: t.customer.id, name: `${t.customer.firstName} ${t.customer.lastName}`.trim(), kycStatus: t.customer.kycStatus }
      : null,
    recipient: {
      fullName: t.beneficiary.fullName,
      phone: t.beneficiary.phone,
      network: t.beneficiary.network,
      country: t.beneficiary.country,
      bankName: t.beneficiary.bankName,
      // Comme dans les listes : le numéro complet ne s'affiche que dans la file de versement, à la demande.
      accountMasked: maskAccount(t.beneficiary.accountNumber),
      bankCode: t.beneficiary.bankCode,
    },
    payInProvider: t.payInProvider,
    payInRef: t.payInRef,
    payoutProvider: t.payoutProvider,
    payoutRef: t.payoutRef,
    failureReason: t.failureReason,
    inQueue,
    createdAt: t.createdAt.toISOString(),
    paidAt: t.paidAt?.toISOString() ?? null,
    deliveredAt: t.deliveredAt?.toISOString() ?? null,
    events: t.events.map((e) => ({ id: e.id, type: e.type, message: e.message, createdAt: e.createdAt.toISOString() })),
  };
}
