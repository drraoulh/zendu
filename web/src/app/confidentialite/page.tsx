import type { Metadata } from "next";
import { PrivacyContent } from "@/components/marketing/legal-document";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment PWFINTECH recueille, utilise et protège vos renseignements personnels, et quels sont vos droits.",
};

export default function Page() {
  return <PrivacyContent />;
}
