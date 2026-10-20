import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPayInMode } from "@/lib/providers/payin";
import { getPayoutMode, momoLiveReady } from "@/lib/providers/payout";
import { isBankNetwork, maskAccount } from "@/lib/bank";
import { expireStaleTransfers } from "@/lib/transfer-service";
import { workQueueWhere } from "../../_server/insights";
import { isLiveMode } from "@/lib/mode";
import { COUNTRIES } from "@/lib/corridors";
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

function nationalNumber(phone: string, country: string): string {
  const dial = COUNTRIES[country]?.dialCode;
  return dial && phone.startsWith(dial) ? phone.slice(dial.length) : phone;
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
        recipientCountry: t.beneficiary.country,
        // Numéro sans l'indicatif, tel qu'on le saisit dans l'appli de versement du pays.
        recipientNational: nationalNumber(t.beneficiary.phone, t.beneficiary.country),
        isBank: isBankNetwork(t.beneficiary.network, t.beneficiary.country),
        recipientBankName: t.beneficiary.bankName,
        // Numéro masqué dans la liste ; le complet s'affiche à la demande (GET bank-payout, session admin).
        recipientAccountMasked: maskAccount(t.beneficiary.accountNumber),
        payoutProvider: t.payoutProvider,
        payInProvider: t.payInProvider,
        senderEmail: t.senderEmail,
        failureReason: t.failureReason,
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
    loadTransfers(workQueueWhere(), 200),
  ]);
  return (
    <AdminDashboard
      transfers={transfers}
      queue={queue}
      live={isLiveMode()}
      results={results}
      filters={filters}
      resultsLimit={RESULTS_LIMIT}
      // Mode réel : encaissement Interac confirmé par l'équipe ; versement MTN automatique seulement
      // avec des clés de production, sinon manuel. Jamais « mock » affiché en mode réel.
      payInMode={isLiveMode() ? "interac" : getPayInMode()}
      payoutMode={isLiveMode() ? (momoLiveReady() ? "momo" : "manual") : getPayoutMode()}
    />
  );
}
