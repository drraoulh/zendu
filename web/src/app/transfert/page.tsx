import type { Metadata } from "next";
import { TransferContent } from "@/components/marketing/transfer-content";

export const metadata: Metadata = {
  title: "Transfert d'argent",
  description:
    "Envoyez de l'argent du Canada vers l'Afrique et le monde : mobile money MTN et Orange, virement bancaire, frais et taux affichés avant de confirmer.",
};

export default function Page() {
  return <TransferContent />;
}
