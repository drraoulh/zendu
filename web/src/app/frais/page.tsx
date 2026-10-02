import type { Metadata } from "next";
import { FeesContent } from "@/components/info/fees-content";
import { getAllDestinations } from "@/components/info/destinations";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Frais, taux et délais",
  description:
    "Frais d'envoi, marge de change et délais de réception de WorldSoft Transfer pour chaque destination depuis le Canada. Taux indicatifs, confirmés avant paiement.",
  alternates: { canonical: "/frais" },
};

export default async function Page() {
  const destinations = await getAllDestinations();
  return <FeesContent destinations={destinations} />;
}
