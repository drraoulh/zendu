import type { Metadata } from "next";
import { SuppliersContent } from "@/components/marketing/suppliers-content";

export const metadata: Metadata = {
  title: "Paiement de fournisseurs",
  description:
    "Payez vos fournisseurs en Chine, en Europe, au Canada et aux États-Unis, par paiement électronique ou manuel, avec une preuve de paiement pour chaque opération.",
};

export default function Page() {
  return <SuppliersContent />;
}
