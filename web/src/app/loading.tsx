import { LogoEmblem } from "@/components/brand/logo";

export default function Loading() {
  return (
    <div className="flex min-h-[55vh] items-center justify-center bg-bg px-4" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-5">
        <span className="relative inline-flex h-24 w-24 items-center justify-center">
          <span
            aria-hidden
            className="absolute inset-0 animate-spin rounded-full border-2 border-brand/15 border-t-brand [animation-duration:1.1s]"
          />
          <span className="inline-flex rounded-2xl bg-white p-2 shadow-card">
            <LogoEmblem className="h-9 w-auto" />
          </span>
        </span>
        <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-muted">
          Chargement · Loading
        </span>
      </div>
    </div>
  );
}
