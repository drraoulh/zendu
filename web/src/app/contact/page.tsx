import type { Metadata } from "next";
import { ContactContent } from "@/components/marketing/contact-content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez PWFINTECH pour un transfert d'argent, un accompagnement financier, un projet technologique ou un envoi de colis.",
};

export default function Page() {
  return <ContactContent />;
}
