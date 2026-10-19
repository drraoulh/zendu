import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPayInMode } from "@/lib/providers/payin";
import { getPayoutMode } from "@/lib/providers/payout";
import { isBankNetwork, MANUAL_BANK_PROVIDER, MANUAL_PAYOUT_PROVIDER, maskAccount } from "@/lib/bank";
import { INTERAC_PROVIDER } from "@/lib/providers/interac";
import { expireStaleTransfers } from "@/lib/transfer-service";
import { isLiveMode } from "@/lib/mode";
import { AdminDashboard, type AdminTransferRow } from "./admin-dashboard";
import { parseTransferFilters, STATUS_GROUPS, type TransferFilters } from "./filters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Transferts",
};

/** Recherche (référence, expéditeur, courriel, destinataire, téléphone) et filtre de statut, sur tous les transferts. */
function filterWhere(f: TransferFilters): Prisma.TransferWhereInput {
  const and: Prisma.TransferWhereInput[] = [];
  if (f.status) and.push({ status: { in: [...STATUS_GROUPS[f.status]] } });
  if (f.q) {
    const q = f.q;
    const digits = q.replace(/\D/g, "");
    and.push({
      OR: [
        { reference: { contains: q, mode: "insensitive" } },
        { senderName: { contains: q, mode: "insensitive" } },
        { senderEmail: { contains: q, mode: "insensitive" } },
        { beneficiary: { fullName: { contains: q, mode: "insensitive" } } },
        ...(digits.length >= 4 ? [{ beneficiary: { phone: { contains: digits } } }] : []),
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

async function loadTransfers(where: Prisma.TransferWhereInput = {}, take = 30): Promise<AdminTransferRow[] | null> {
  return prisma.transfer
    .findMany({
      where,
      include: { beneficiary: true, events: { where: { type: "interac_declared" }, select: { createdAt: true }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take,
    })
    .then((transfers) =>
      transfers.map((t) => ({
        id: t.id,
        reference: t.reference,
        status: t.status,
        sendCurrency: t.sendCurrency,
        receiveCurrency: t.receiveCurrency,
        totalCad: t.totalCad,
        receiveAmountXaf: t.receiveAmountXaf,
        senderName: t.senderName,
        recipientName: t.beneficiary.fullName,
        recipientPhone: t.beneficiary.phone,
        recipientNetwork: t.beneficiary.network,
        isBank: isBankNetwork(t.beneficiary.network, t.beneficiary.country),
        recipientBankName: t.beneficiary.bankName,
        // Numéro masqué dans la liste ; le complet s'affiche à la demande (GET bank-payout, session admin).
        recipientAccountMasked: maskAccount(t.beneficiary.accountNumber),
        payoutProvider: t.payoutProvider,
        payInProvider: t.payInProvider,
        senderEmail: t.senderEmail,
        interacDeclaredAt: t.events[0]?.createdAt.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
      })),
    )
    .catch((err: unknown) => {
      console.error("[admin] impossible de charger les transferts", err);
      return null;
    });
}

const RESULTS_LIMIT = 100;

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminPage({ searchParams }: Props) {
  const filters = parseTransferFilters(await searchParams);
  const filtering = Boolean(filters.q || filters.status);
  await expireStaleTransfers().catch((err: unknown) => console.error("[admin] expiration impossible", err));
  const [transfers, results, queue] = await Promise.all([
    loadTransfers(),
    filtering ? loadTransfers(filterWhere(filters), RESULTS_LIMIT) : Promise.resolve(undefined),
    // Files de travail chargées à part : un dossier en attente ne doit jamais disparaître parce que
    // d'autres transferts plus récents ont été créés.
    loadTransfers(
      {
        OR: [
          { payInProvider: INTERAC_PROVIDER, status: "awaiting_payment" },
          // Virement signalé envoyé par le client mais arrivé après l'expiration : encore confirmable.
          {
            payInProvider: INTERAC_PROVIDER,
            status: "expired",
            createdAt: { gte: new Date(Date.now() - 7 * 86400_000) },
            events: { some: { type: "interac_declared" } },
          },
          { payoutProvider: { in: [MANUAL_BANK_PROVIDER, MANUAL_PAYOUT_PROVIDER] }, status: { in: ["payout_queued", "payout_sent"] } },
        ],
      },
      200,
    ),
  ]);
  return (
    <AdminDashboard
      transfers={transfers}
      queue={queue}
      live={isLiveMode()}
      results={results}
      filters={filters}
      resultsLimit={RESULTS_LIMIT}
      payInMode={getPayInMode()}
      payoutMode={getPayoutMode()}
    />
  );
}
