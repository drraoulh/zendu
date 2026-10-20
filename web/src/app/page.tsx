import { HomeHero, ShortcutsBand } from "@/app/home/home-hero";
import { AppSection, FaqSection, FinalCta } from "@/app/home/home-more";
import { ServicesSection, ValuesSection } from "@/app/home/home-sections";

/** Accueil du site PWFINTECH (l'accueil de WorldSoft Transfer est la page /transfert). */
export default function HomePage() {
  return (
    <>
      <HomeHero />
      <ShortcutsBand />
      <ServicesSection />
      <AppSection />
      <ValuesSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}
