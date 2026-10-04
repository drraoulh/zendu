import type { Metadata } from "next";
import { ShippingQuoteJourney } from "@/components/journeys/shipping-quote";

export const metadata: Metadata = {
  title: "Demander un devis — Shipping",
  description:
    "Demandez un devis d'expédition entre le Canada, la Chine et le Cameroun, par fret aérien ou maritime.",
};

export default function Page() {
  return <ShippingQuoteJourney />;
}
