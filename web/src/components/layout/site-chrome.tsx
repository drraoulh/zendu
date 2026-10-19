"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * En-tête, bandeau démo et pied de page du site public : masqués dans l'administration (/admin),
 * qui a son propre menu.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  return <>{children}</>;
}
