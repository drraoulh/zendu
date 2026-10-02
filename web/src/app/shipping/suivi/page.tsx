import type { Metadata } from "next";
import { TrackingContent } from "@/components/journeys/tracking";

export const metadata: Metadata = {
  title: "Suivre un colis — Shipping",
  description: "Suivez votre envoi PWFINTECH Shipping avec votre numéro PWS : trajet, étape en cours et historique.",
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const raw = sp.numero ?? sp.number;
  const numero = (Array.isArray(raw) ? raw[0] : raw)?.slice(0, 20) ?? "";
  return <TrackingContent initialNumber={numero} />;
}
