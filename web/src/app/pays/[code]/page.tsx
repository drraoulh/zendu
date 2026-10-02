import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CountryContent } from "@/components/info/country-content";
import { destinationCodes, getDestination } from "@/components/info/destinations";
import { COUNTRIES } from "@/lib/corridors";

export const revalidate = 3600;
export const dynamicParams = false;

type Params = Promise<{ code: string }>;

export function generateStaticParams() {
  return destinationCodes().map((code) => ({ code: code.toLowerCase() }));
}

function frenchName(code: string, fallback: string): string {
  try {
    return new Intl.DisplayNames(["fr-CA"], { type: "region" }).of(code) ?? fallback;
  } catch {
    return fallback;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { code } = await params;
  const country = COUNTRIES[code.toUpperCase()];
  if (!country || !destinationCodes().includes(country.code)) return { title: "Pays introuvable" };
  const name = frenchName(country.code, country.name);
  const modes = country.networks.map((n) => (n.type === "bank" ? "virement bancaire" : n.type === "cash" ? "retrait en espèces" : n.label));
  return {
    title: `Envoyer de l'argent vers ${name}`,
    description: `Transfert d'argent du Canada vers ${name} avec WorldSoft Transfer : réception en ${country.currency} par ${modes.join(", ")}. Frais, délais et conseils.`,
    alternates: { canonical: `/pays/${country.code.toLowerCase()}` },
    openGraph: {
      title: `Envoyer de l'argent vers ${name} · WorldSoft Transfer`,
      description: `Frais, délais et modes de réception pour envoyer de l'argent du Canada vers ${name}.`,
    },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { code } = await params;
  const destination = await getDestination(code);
  if (!destination) notFound();
  const others = destinationCodes()
    .filter((c) => c !== destination.code)
    .map((c) => ({ code: c, name: COUNTRIES[c].name, currency: COUNTRIES[c].currency }));
  return <CountryContent destination={destination} others={others} dialCode={COUNTRIES[destination.code].dialCode} />;
}
