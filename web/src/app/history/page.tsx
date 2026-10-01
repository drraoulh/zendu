import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { maskAccount } from "@/lib/bank";
import { HistoryView, type HistoryItem } from "./history-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mes transferts",
  robots: { index: false },
};

export default async function HistoryPage() {
  let failed = false;
  const transfers = await prisma.transfer
    .findMany({
      include: { beneficiary: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
    .catch((error) => {
      console.error("History: impossible de charger les transferts", error);
      failed = true;
      return [];
    });

  const items: HistoryItem[] = transfers.map((t) => ({
    id: t.id,
    reference: t.reference,
    corridorId: t.corridorId || "CA-CM",
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    receiveAmount: t.receiveAmountXaf,
    receiveCurrency: t.receiveCurrency || "XAF",
    sendAmount: t.sendAmountCad,
    sendCurrency: t.sendCurrency || "CAD",
    recipientName: t.beneficiary.fullName,
    network: t.beneficiary.network,
    accountMasked: maskAccount(t.beneficiary.accountNumber),
  }));

  return <HistoryView transfers={items} unavailable={failed} />;
}
