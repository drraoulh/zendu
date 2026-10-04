import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CountryContent } from "@/components/info/country-content";
import { countryCodes, getCountryInfo } from "@/components/info/destinations";
import { COUNTRIES } from "@/lib/corridors";

export const revalidate = 3600;
export const dynamicParams = false;

type Params = Promise<{ code: string }>;

const FR: Record<string, { name: string; to: string }> = {
  CA: { name: "Canada", to: "vers le Canada" },
  CM: { name: "Cameroun", to: "vers le Cameroun" },
  CN: { name: "Chine", to: "vers la Chine" },
};

export function generateStaticParams() {
  return countryCodes().map((code) => ({ code: code.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { code } = await params;
  const upper = code.toUpperCase();
  const country = COUNTRIES[upper];
  if (!country) return { title: "Pays introuvable" };
  const fr = FR[upper] ?? { name: country.name, to: `vers ${country.name}` };
  const modes = country.networks.map((n) => (n.type === "bank" ? "compte bancaire" : n.type === "cash" ? "retrait en espèces" : n.label));
  return {
    title: `Envoyer de l'argent ${fr.to}`,
    description: `Transfert d'argent ${fr.to} avec WorldSoft Transfer : réception en ${country.currency} par ${modes.join(", ")}. Frais, délais et conseils.`,
    alternates: { canonical: `/pays/${upper.toLowerCase()}` },
    openGraph: {
      title: `Envoyer de l'argent ${fr.to} · WorldSoft Transfer`,
      description: `Frais, délais et modes de réception pour envoyer de l'argent ${fr.to}.`,
    },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { code } = await params;
  const country = await getCountryInfo(code);
  if (!country) notFound();
  const others = countryCodes()
    .filter((c) => c !== country.code)
    .map((c) => ({ code: c, name: COUNTRIES[c].name, currency: COUNTRIES[c].currency }));
  return <CountryContent country={country} others={others} />;
}
