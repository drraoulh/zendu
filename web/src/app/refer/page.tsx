import type { Metadata } from "next";
import { ReferContent } from "./refer-content";

export const metadata: Metadata = {
  title: "Parrainage",
  description: "Partagez votre code de parrainage PWFINTECH avec vos proches.",
};

export default function ReferPage() {
  return <ReferContent />;
}
