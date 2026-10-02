import type { Metadata } from "next";
import { CountriesContent } from "@/components/info/countries-content";
import { getAllDestinations } from "@/components/info/destinations";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pays desservis",
  description:
    "Toutes les destinations de WorldSoft Transfer depuis le Canada : Afrique, Asie et Caraïbes. Modes de réception (mobile money, banque, retrait), devises et délais.",
  alternates: { canonical: "/pays" },
};

export default async function Page() {
  const destinations = await getAllDestinations();
  return <CountriesContent destinations={destinations} />;
}
