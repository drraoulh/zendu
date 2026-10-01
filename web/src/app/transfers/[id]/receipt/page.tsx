import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReceiptByTransferId, type ReceiptData } from "@/lib/receipt";
import { getCorridor } from "@/lib/corridors";
import { ReceiptView } from "@/components/transfer-app/receipt-view";
import { ReceiptUnavailable } from "@/components/transfer-app/receipt-unavailable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reçu de transfert",
  robots: { index: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function ReceiptPage({ params }: Props) {
  const { id } = await params;
  let receipt: ReceiptData | null = null;
  let failed = false;
  try {
    receipt = await getReceiptByTransferId(id);
  } catch (error) {
    console.error("Receipt: impossible de charger le reçu", error);
    failed = true;
  }

  if (failed) return <ReceiptUnavailable transferId={id} />;
  if (!receipt) notFound();

  const deliveryEstimate = getCorridor(receipt.corridorId)?.deliveryEstimate ?? "A few minutes";
  return <ReceiptView receipt={receipt} transferId={id} deliveryEstimate={deliveryEstimate} />;
}
