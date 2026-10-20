import type { Metadata } from "next";
import { AboutContent } from "@/components/marketing/about-content";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Découvrez Paul World Finances and Technologies : notre histoire, notre mission, nos valeurs et nos six activités — transfert d'argent, AVI pour visa études, paiement de fournisseurs, finances, technologies et shipping.",
};

export default function Page() {
  return <AboutContent />;
}
