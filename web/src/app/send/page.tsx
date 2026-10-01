import type { Metadata } from "next";
import { Suspense } from "react";
import { SendFlow } from "./send-flow";

export const metadata: Metadata = {
  title: "Envoyer de l'argent",
  description: "Envoyez de l'argent depuis le Canada : devis en direct, frais affichés avant de payer et suivi jusqu'à la livraison.",
};

export default function SendPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-bg px-5 py-24" role="status">
          <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-3xl bg-white shadow-card" />
        </div>
      }
    >
      <SendFlow />
    </Suspense>
  );
}
