import { HomeHero, ShortcutsBand } from "@/app/home/home-hero";
import { AppSection, DestinationsSection, FaqSection, FinalCta } from "@/app/home/home-more";
import { FeesSection, ServicesSection, StepsSection, ValuesSection } from "@/app/home/home-sections";
import { getDestinationCountries } from "@/lib/corridors";

export default function HomePage() {
  const destinations = getDestinationCountries().map((c) => ({
    code: c.code,
    name: c.name,
    currency: c.currency,
  }));

  return (
    <>
      <HomeHero />
      <ShortcutsBand />
      <ServicesSection />
      <AppSection />
      <StepsSection />
      <FeesSection />
      <DestinationsSection destinations={destinations} />
      <ValuesSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}
