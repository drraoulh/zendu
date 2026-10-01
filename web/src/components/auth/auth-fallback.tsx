import { LogoEmblem } from "@/components/brand/logo";

/** Squelette affiché pendant le chargement des paramètres de recherche. */
export function AuthFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-bg px-4">
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <span className="inline-flex rounded-2xl bg-white p-2 shadow-card">
          <LogoEmblem className="h-10 w-auto" />
        </span>
        <span className="live-dot" />
        <span className="sr-only">Chargement…</span>
      </div>
    </div>
  );
}
