import type { Metadata } from "next";
import { ThankYouContent } from "@/components/journeys/thank-you";

export const metadata: Metadata = {
  title: "Merci",
  description: "Votre demande a bien été reçue par PWFINTECH.",
  robots: { index: false, follow: false },
};

function first(v: string | string[] | undefined): string | undefined {
  return (Array.isArray(v) ? v[0] : v)?.slice(0, 40);
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return <ThankYouContent reference={first(sp.ref)} kind={first(sp.kind)} />;
}
