import type { Metadata } from "next";
import QRCode from "qrcode";
import { ApplicationContent, type Simulation } from "@/components/app/application-content";
import { getCorridor, getCountry, getDestinationCountries } from "@/lib/corridors";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const metadata: Metadata = {
  title: { absolute: "WorldSoft Transfer — l'application" },
  description:
    "WorldSoft Transfer, une solution PWFINTECH : envoyez de l'argent depuis votre téléphone, avec des frais clairs, la livraison mobile money ou bancaire et le suivi en temps réel.",
  alternates: { canonical: "/application" },
  openGraph: {
    title: "WorldSoft Transfer — l'application",
    description: "Envoyez de l'argent depuis votre téléphone. Une solution PWFINTECH.",
    url: "/application",
    images: [{ url: "/brand/wst/og-image-1200x630.png", width: 1200, height: 630 }],
  },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function readSimulation(params: Record<string, string | string[] | undefined>): Simulation | null {
  const corridorId = first(params.corridor)?.trim().toUpperCase();
  const amount = Number(first(params.amount));
  if (!corridorId || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) return null;
  const corridor = getCorridor(corridorId);
  if (!corridor) return null;
  try {
    const from = getCountry(corridor.source);
    const to = getCountry(corridor.destination);
    return {
      corridor: corridor.id,
      amount,
      currency: from.currency,
      destCode: to.code,
      destName: to.name,
    };
  } catch {
    return null;
  }
}

async function qrSvg(): Promise<string | null> {
  try {
    return await QRCode.toString(`${appUrl}/application`, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#061a52", light: "#ffffff" },
    });
  } catch {
    return null;
  }
}

export default async function ApplicationPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const qr = await qrSvg();
  const destinations = getDestinationCountries().map((c) => ({ code: c.code, name: c.name }));
  return <ApplicationContent qrSvg={qr} simulation={readSimulation(params)} destinations={destinations} />;
}
