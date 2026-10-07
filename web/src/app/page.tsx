import { HomeHero, ShortcutsBand } from "@/app/home/home-hero";
import { AppSection, DestinationsSection, FaqSection, FinalCta } from "@/app/home/home-more";
import { FeesSection, ServicesSection, StepsSection, ValuesSection } from "@/app/home/home-sections";
import { CORRIDORS, getCountry } from "@/lib/corridors";

export default function HomePage() {
  const routes = CORRIDORS.filter((c) => c.active).map((c) => {
    const from = getCountry(c.source);
    const to = getCountry(c.destination);
    return {
      id: c.id,
      source: from.code,
      sourceName: from.name,
      dest: to.code,
      destName: to.name,
      sendCurrency: from.currency,
      receiveCurrency: to.currency,
      networks: to.networks.map((n) => ({ id: n.id, label: n.label, type: n.type })),
      fast: c.deliveryEstimate === "A few minutes",
    };
  });

  return (
    <>
      <HomeHero />
      <ShortcutsBand />
      <ServicesSection />
      <AppSection />
      <StepsSection />
      <FeesSection />
      <DestinationsSection routes={routes} />
      <ValuesSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}
