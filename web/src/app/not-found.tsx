export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-5 text-center">
      <p className="font-display text-5xl font-bold text-accent">404</p>
      <h1 className="mt-3 font-display text-2xl font-bold">Page introuvable</h1>
      <p className="mt-2 text-ink-muted">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <a
        href="/"
        className="mt-6 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-strong"
      >
        Retour à l&apos;accueil
      </a>
    </div>
  );
}
