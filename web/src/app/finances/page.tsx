import type { Metadata } from "next";
import { FinancesContent } from "@/components/marketing/finances-content";

export const metadata: Metadata = {
  title: "Accompagnement financier",
  description:
    "Conseil et planification budgétaire, épargne, accompagnement des PME et des entrepreneurs de la diaspora, éducation financière et aide aux démarches.",
};

export default function Page() {
  return <FinancesContent />;
}
