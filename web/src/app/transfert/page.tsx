import type { Metadata } from "next";
import { TransferContent } from "@/components/marketing/transfer-content";

export const metadata: Metadata = {
  title: { absolute: "WorldSoft Transfer — Canada · Cameroun · Chine" },
  description:
    "WorldSoft Transfer, l'application de transfert d'argent de PWFINTECH : mobile money, virement bancaire ou retrait, avec le taux, les frais et le délai affichés avant de payer. Simulez votre envoi en ligne.",
  openGraph: {
    title: "WorldSoft Transfer — Canada · Cameroun · Chine",
    description: "L'application de transfert d'argent de PWFINTECH. Les frais, vous les voyez avant.",
    images: [{ url: "/brand/wst/og-image-1200x630.png", width: 1200, height: 630, alt: "WorldSoft Transfer" }],
  },
};

export default function Page() {
  return <TransferContent />;
}
