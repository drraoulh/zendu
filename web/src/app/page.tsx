import { HomeHero } from "@/app/home/home-hero";
import { BrandSection, DestinationsSection, FaqSection, FinalCta } from "@/app/home/home-more";
import { ServicesSection, StepsSection, ValuesSection } from "@/app/home/home-sections";
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
      <ServicesSection />
      <StepsSection />
      <ValuesSection />
      <DestinationsSection destinations={destinations} />
      <BrandSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}
