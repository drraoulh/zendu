import type { Metadata } from "next";
import { TechnologiesContent } from "@/components/marketing/technologies-content";

export const metadata: Metadata = {
  title: "Technologies",
  description:
    "Développement web et mobile, solutions fintech et paiements, transformation numérique, conseil IT, maintenance et formation.",
};

export default function Page() {
  return <TechnologiesContent />;
}
