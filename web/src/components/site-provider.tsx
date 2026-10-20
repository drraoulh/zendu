"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { siteOfPath, type SiteId } from "@/lib/site";

type SiteContext = {
  site: SiteId;
  /** Adresse de chaque site ("" = même domaine que la page). */
  origins: Record<SiteId, string>;
};

const Ctx = createContext<SiteContext>({ site: "pwfintech", origins: { pwfintech: "", wst: "" } });

export function SiteProvider({ value, children }: { value: SiteContext; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSite() {
  const { site, origins } = useContext(Ctx);
  /** Lien absolu vers une page d'un site donné quand il est sur l'autre domaine. */
  const siteHref = useCallback(
    (target: SiteId, path: string) => (target === site ? path : `${origins[target]}${path}`),
    [site, origins],
  );
  /** Un chemin interne, rendu absolu s'il appartient à l'autre site ("/frais" vu depuis PWFINTECH…). */
  const link = useCallback(
    (href: string) => {
      if (!href.startsWith("/")) return href;
      const owner = siteOfPath(href.split(/[?#]/)[0]);
      return owner && owner !== site ? `${origins[owner]}${href}` : href;
    },
    [site, origins],
  );
  return { site, origins, siteHref, link };
}
