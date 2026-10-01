import type { Metadata } from "next";
import { TermsContent } from "@/components/marketing/legal-document";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description:
    "Les conditions d'utilisation du site et des services de PWFINTECH : transfert d'argent, shipping, finances et technologies.",
};

export default function Page() {
  return <TermsContent />;
}
