import type { Metadata } from "next";
import { AviContent } from "@/components/marketing/avi-content";

export const metadata: Metadata = {
  title: "AVI pour visa études",
  description:
    "Attestation de virement irrévocable (AVI) pour votre visa études en France, en Belgique, en Allemagne ou en Italie : demande, dossier et remise de l'attestation.",
};

export default function Page() {
  return <AviContent />;
}
