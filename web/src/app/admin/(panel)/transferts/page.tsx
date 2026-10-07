import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getPayInMode } from "@/lib/providers/payin";
import { getPayoutMode } from "@/lib/providers/payout";
import { isBankNetwork, maskAccount } from "@/lib/bank";
import { AdminDashboard, type AdminTransferRow } from "./admin-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Transferts",
};

async function loadTransfers(): Promise<AdminTransferRow[] | null> {
  return prisma.transfer
    .findMany({
      include: { beneficiary: true, events: { where: { type: "interac_declared" }, select: { createdAt: true }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 30,
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

export default async function AdminPage() {
  const transfers = await loadTransfers();
  return <AdminDashboard transfers={transfers} payInMode={getPayInMode()} payoutMode={getPayoutMode()} />;
}
