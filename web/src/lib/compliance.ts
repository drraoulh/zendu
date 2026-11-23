import { prisma } from "@/lib/prisma";
import { transferLimits } from "@/lib/mode";
import { pricingFor } from "@/lib/pricing";

/* ------------------------------------------------------------------ */
/* Signes d'alerte (à examiner par le responsable de la conformité)    */
/* ------------------------------------------------------------------ */

export type FlagInput = {
  id: string;
  customerId: string | null;
  totalCad: number;
  beneficiary: { phone: string };
};

const OPEN = { notIn: ["expired", "cancelled"] };
const DAY = 86_400_000;

/**
 * Signes d'alerte automatiques par transfert (clé = id du transfert) :
 * fractionnement, proximité du plafond journalier, même bénéficiaire pour plusieurs clients, premier envoi élevé.
 * Trois requêtes au total, quel que soit le nombre de lignes.
 */
export async function transferFlags(rows: FlagInput[]): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (!rows.length) return out;
  const limits = transferLimits();
  const now = Date.now();
  const customerIds = [...new Set(rows.map((r) => r.customerId).filter((v): v is string => Boolean(v)))];
  const phones = [...new Set(rows.map((r) => r.beneficiary.phone).filter(Boolean))];

  const [recent, totals, shared] = await Promise.all([
    customerIds.length
      ? prisma.transfer.findMany({
          where: { customerId: { in: customerIds }, status: OPEN, sendCurrency: "CAD", createdAt: { gte: new Date(now - DAY) } },
          select: { customerId: true, totalCad: true },
        })
      : Promise.resolve([]),
    customerIds.length
      ? prisma.transfer.groupBy({ by: ["customerId"], where: { customerId: { in: customerIds }, status: OPEN }, _count: { _all: true } })
      : Promise.resolve([]),
    phones.length
      ? prisma.transfer.findMany({
          where: { beneficiary: { phone: { in: phones } }, status: OPEN, customerId: { not: null }, createdAt: { gte: new Date(now - 30 * DAY) } },
          select: { customerId: true, beneficiary: { select: { phone: true } } },
        })
      : Promise.resolve([]),
  ]);

  const day = new Map<string, { n: number; sum: number }>();
  for (const t of recent) {
    if (!t.customerId) continue;
    const d = day.get(t.customerId) ?? { n: 0, sum: 0 };
    d.n += 1;
    d.sum += t.totalCad;
    day.set(t.customerId, d);
  }
  const count = new Map(totals.map((t) => [t.customerId ?? "", t._count._all]));
  const byPhone = new Map<string, Set<string>>();
  for (const s of shared) {
    if (!s.customerId) continue;
    const set = byPhone.get(s.beneficiary.phone) ?? new Set<string>();
    set.add(s.customerId);
    byPhone.set(s.beneficiary.phone, set);
  }

  for (const r of rows) {
    const flags: string[] = [];
    const d = r.customerId ? day.get(r.customerId) : undefined;
    if (d && d.n >= 3) flags.push(`Fractionnement possible : ${d.n} envois en 24 h`);
    if (d && d.sum >= limits.dailyCad * 0.8) flags.push("Proche du plafond journalier");
    const sharedCount = byPhone.get(r.beneficiary.phone)?.size ?? 0;
    if (sharedCount >= 3) flags.push(`Même bénéficiaire pour ${sharedCount} clients (30 jours)`);
    if (r.customerId && count.get(r.customerId) === 1 && r.totalCad >= limits.monthlyCad * 0.5) flags.push("Premier envoi élevé");
    if (flags.length) out.set(r.id, flags);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Rapprochement                                                       */
/* ------------------------------------------------------------------ */

const TZ = "America/Toronto";
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);

export type ReconDay = {
  date: string;
  receivedCount: number;
  receivedCad: number;
  deliveredCount: number;
  paidOut: Record<string, number>;
  feesCad: number;
  estimatedMarginCad: number;
};

export type ReconIssue = { reference: string; status: string; reason: string; since: string };

export type ReconRow = {
  createdAt: string;
  reference: string;
  status: string;
  sender: string;
  recipient: string;
  corridor: string;
  sendCurrency: string;
  sendAmount: number;
  fee: number;
  total: number;
  rate: number;
  receiveCurrency: string;
  receiveAmount: number;
  paidAt: string;
  deliveredAt: string;
  payInProvider: string;
  payoutProvider: string;
  payoutRef: string;
  estimatedMarginCad: number;
};

/** Marge estimée en CAD : frais + marge de change au taux de référence du trajet (estimation, pas un chiffre comptable). */
function estimatedMargin(t: { sendCurrency: string; sendAmountCad: number; feeCad: number; corridorId: string }): number {
  if (t.sendCurrency !== "CAD") return 0;
  return Math.round((t.feeCad + (t.sendAmountCad * pricingFor(t.corridorId).marginPercent) / 100) * 100) / 100;
}

export async function reconciliation(from: Date, to: Date) {
  const [paid, delivered, created, stuck, noRef] = await Promise.all([
    prisma.transfer.findMany({ where: { paidAt: { gte: from, lt: to } }, select: { paidAt: true, totalCad: true, sendCurrency: true } }),
    prisma.transfer.findMany({
      where: { deliveredAt: { gte: from, lt: to } },
      select: { deliveredAt: true, receiveAmountXaf: true, receiveCurrency: true, feeCad: true, sendAmountCad: true, sendCurrency: true, corridorId: true },
    }),
    prisma.transfer.findMany({
      where: { createdAt: { gte: from, lt: to } },
      include: { beneficiary: { select: { fullName: true } } },
      orderBy: { createdAt: "asc" },
      take: 5000,
    }),
    prisma.transfer.findMany({
      where: { status: { in: ["payment_detected", "payout_queued", "payout_sent", "payout_failed"] }, paidAt: { lt: new Date(Date.now() - DAY) } },
      select: { reference: true, status: true, paidAt: true },
      orderBy: { paidAt: "asc" },
      take: 100,
    }),
    prisma.transfer.findMany({
      where: { status: "delivered", payoutRef: null, deliveredAt: { gte: from, lt: to } },
      select: { reference: true, status: true, deliveredAt: true },
      take: 100,
    }),
  ]);

  const days = new Map<string, ReconDay>();
  const get = (k: string): ReconDay => {
    let d = days.get(k);
    if (!d) {
      d = { date: k, receivedCount: 0, receivedCad: 0, deliveredCount: 0, paidOut: {}, feesCad: 0, estimatedMarginCad: 0 };
      days.set(k, d);
    }
    return d;
  };
  for (const t of paid) {
    if (!t.paidAt) continue;
    const d = get(dayKey(t.paidAt));
    d.receivedCount += 1;
    if (t.sendCurrency === "CAD") d.receivedCad += t.totalCad;
  }
  for (const t of delivered) {
    if (!t.deliveredAt) continue;
    const d = get(dayKey(t.deliveredAt));
    d.deliveredCount += 1;
    d.paidOut[t.receiveCurrency] = (d.paidOut[t.receiveCurrency] ?? 0) + t.receiveAmountXaf;
    if (t.sendCurrency === "CAD") d.feesCad += t.feeCad;
    d.estimatedMarginCad += estimatedMargin(t);
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  const list = [...days.values()]
    .map((d) => ({ ...d, receivedCad: round(d.receivedCad), feesCad: round(d.feesCad), estimatedMarginCad: round(d.estimatedMarginCad) }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const issues: ReconIssue[] = [
    ...stuck.map((t) => ({ reference: t.reference, status: t.status, reason: "Argent reçu depuis plus de 24 h, versement non terminé", since: t.paidAt?.toISOString() ?? "" })),
    ...noRef.map((t) => ({ reference: t.reference, status: t.status, reason: "Livré sans référence de versement", since: t.deliveredAt?.toISOString() ?? "" })),
  ];

  const rows: ReconRow[] = created.map((t) => ({
    createdAt: t.createdAt.toISOString(),
    reference: t.reference,
    status: t.status,
    sender: t.senderName,
    recipient: t.beneficiary.fullName,
    corridor: t.corridorId,
    sendCurrency: t.sendCurrency,
    sendAmount: t.sendAmountCad,
    fee: t.feeCad,
    total: t.totalCad,
    rate: t.rate,
    receiveCurrency: t.receiveCurrency,
    receiveAmount: t.receiveAmountXaf,
    paidAt: t.paidAt?.toISOString() ?? "",
    deliveredAt: t.deliveredAt?.toISOString() ?? "",
    payInProvider: t.payInProvider,
    payoutProvider: t.payoutProvider,
    payoutRef: t.payoutRef ?? "",
    estimatedMarginCad: t.status === "delivered" ? estimatedMargin(t) : 0,
  }));

  return { days: list, issues, rows };
}

/** Une cellule CSV sûre : guillemets doublés, et pas de formule exécutable à l'ouverture dans un tableur. */
export function csvCell(v: string | number): string {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Date AAAA-MM-JJ (heure de Toronto) → début de journée en UTC approximatif ; null si invalide. */
export function parseDay(raw: string | null | undefined): Date | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}T00:00:00-05:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
