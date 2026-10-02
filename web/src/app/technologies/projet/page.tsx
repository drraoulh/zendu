import type { Metadata } from "next";
import { TechProjectJourney } from "@/components/journeys/tech-project";

export const metadata: Metadata = {
  title: "Parler de votre projet — Technologies",
  description:
    "Décrivez votre projet web, mobile, fintech ou de transformation numérique : l'équipe PWFINTECH vous recontacte avec des pistes concrètes.",
};

export default function Page() {
  return <TechProjectJourney />;
}
