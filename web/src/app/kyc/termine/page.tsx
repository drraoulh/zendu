import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vérification terminée",
  robots: { index: false },
};

/** Page de fin du parcours Didit (callback) : le client revient dans l'application. */
export default function KycDone() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-2xl text-success" aria-hidden>
        ✓
      </span>
      <h1 className="mt-5 font-display text-2xl font-extrabold text-ink">Vérification envoyée</h1>
      <p className="mt-3 text-muted">
        Merci. Vous pouvez fermer cette page et revenir dans l&apos;application WorldSoft Transfer : votre statut s&apos;y met à
        jour automatiquement.
      </p>
    </section>
  );
}
