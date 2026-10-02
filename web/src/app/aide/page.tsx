import type { Metadata } from "next";
import { HelpCenter } from "@/components/info/help-content";
import { getHelpNumbers } from "@/components/info/destinations";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Centre d'aide",
  description:
    "Réponses aux questions sur WorldSoft Transfer, les transferts, les frais, la sécurité du compte et les services Shipping, Finances et Technologies de PWFINTECH.",
  alternates: { canonical: "/aide" },
};

export default async function Page() {
  const numbers = await getHelpNumbers();
  return <HelpCenter numbers={numbers} />;
}
