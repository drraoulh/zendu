import type { Metadata } from "next";
import { FinanceAppointmentJourney } from "@/components/journeys/finance-appointment";

export const metadata: Metadata = {
  title: "Prendre rendez-vous — Finances",
  description:
    "Réservez un rendez-vous d'accompagnement financier (budget, épargne, PME, éducation financière) en visioconférence ou par téléphone.",
};

export default function Page() {
  return <FinanceAppointmentJourney />;
}
