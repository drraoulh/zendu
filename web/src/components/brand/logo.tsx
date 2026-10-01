import Image from "next/image";
import { appFullName, appName, logo } from "@/lib/brand";

/** Emblème PW (globe + skyline) seul. */
export function LogoEmblem({ className = "h-10 w-auto", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src={logo.emblem.src}
      width={logo.emblem.width}
      height={logo.emblem.height}
      alt={appName}
      className={className}
      priority={priority}
    />
  );
}

/** Emblème + nom, pour l'en-tête et le pied de page. */
export function LogoWordmark({ light = false, priority = false }: { light?: boolean; priority?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={`inline-flex items-center rounded-xl ${light ? "bg-white px-1.5 py-1" : ""}`}>
        <LogoEmblem className="h-9 w-auto sm:h-10" priority={priority} />
      </span>
      <span className="leading-none">
        <span
          className={`block font-display text-lg font-black tracking-tight sm:text-xl ${
            light ? "text-white" : "text-gradient-brand"
          }`}
        >
          {appName}
        </span>
        <span
          className={`mt-1 hidden text-[0.6rem] font-semibold uppercase tracking-[0.14em] sm:block ${
            light ? "text-white/60" : "text-muted"
          }`}
        >
          {appFullName}
        </span>
      </span>
    </span>
  );
}

/** Logo complet officiel (carré, fond blanc). */
export function LogoFull({ className = "h-auto w-full", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src={logo.full.src}
      width={logo.full.width}
      height={logo.full.height}
      alt={`${appName} — ${appFullName}`}
      className={className}
      priority={priority}
    />
  );
}
