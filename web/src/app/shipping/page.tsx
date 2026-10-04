import type { Metadata } from "next";
import { ShippingContent } from "@/components/marketing/shipping-content";

export const metadata: Metadata = {
  title: "Shipping",
  description:
    "Envoi de colis et de marchandises entre le Canada, la Chine et le Cameroun : fret aérien et maritime, achat pour vous, dédouanement et suivi. Demandez un devis.",
};

export default function Page() {
  return <ShippingContent />;
}
