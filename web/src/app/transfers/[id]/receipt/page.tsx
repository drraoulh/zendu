import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReceiptByTransferId, type ReceiptData } from "@/lib/receipt";
import { ReceiptView } from "@/components/transfer-app/receipt-view";
import { ReceiptUnavailable } from "@/components/transfer-app/receipt-unavailable";
import { prisma } from "@/lib/prisma";
import { maskEmail, maskName, maskPhone } from "@/app/api/transfers/[id]/_access";
import { adminPageAccess } from "@/app/admin/_server/session";

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
    // Mêmes droits que GET /api/transfers/[id]/receipt : complet pour l'équipe, masqué pour un envoi
    // sans compte consulté par lien, rien pour le transfert d'un client de l'appli.
    const owner = await prisma.transfer.findUnique({ where: { id }, select: { customerId: true } });
    const admin = (await adminPageAccess()).ok;
    if (owner && (admin || owner.customerId === null)) {
      receipt = await getReceiptByTransferId(id);
      if (receipt && !admin) {
        receipt = {
          ...receipt,
          sender: { name: maskName(receipt.sender.name), email: maskEmail(receipt.sender.email) },
          recipient: { ...receipt.recipient, name: maskName(receipt.recipient.name), phone: maskPhone(receipt.recipient.phone), bankCode: null },
          payoutRef: null,
        };
      }
    }
  } catch (error) {
    console.error("Receipt: impossible de charger le reçu", error);
    failed = true;
  }

  if (failed) return <ReceiptUnavailable transferId={id} />;
  if (!receipt) notFound();

  // Délai déjà ajusté pour un virement bancaire dans getReceiptByTransferId.
  return <ReceiptView receipt={receipt} transferId={id} deliveryEstimate={receipt.deliveryEstimate} />;
}
