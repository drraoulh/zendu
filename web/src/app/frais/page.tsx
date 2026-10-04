import type { Metadata } from "next";
import { FeesContent } from "@/components/info/fees-content";
import { getAllCorridorInfos } from "@/components/info/destinations";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Frais, taux et délais",
  description:
    "Frais d'envoi, marge de change et délais de réception de WorldSoft Transfer entre le Canada, le Cameroun et la Chine. Taux indicatifs, confirmés avant paiement.",
  alternates: { canonical: "/frais" },
};

export default async function Page() {
  const destinations = await getAllCorridorInfos();
  return <FeesContent destinations={destinations} />;
}
