import { company } from "@/lib/company";

/** Noms de marque fixes : ils ne dépendent plus des variables d'environnement (anciennes valeurs « Zendu »). */
export const appName = "PWFINTECH";
export const appFullName = "Paul World Finances and Technologies";

/**
 * Coordonnées (compatibilité) — dérivées de la fiche entreprise `@/lib/company`.
 * Préférez `company` + `display()` dans le nouveau code : ici les valeurs absentes
 * deviennent des chaînes vides (sauf le courriel, qui garde son ancien repli pour
 * ne pas casser les liens mailto: existants).
 */
export const contact = {
  email: company.email ?? "contact@pwfintech.ca",
  phone: company.phone ?? "",
  whatsapp: company.whatsapp ?? "",
  city: company.city ?? "",
  country: company.country,
};

export const logo = {
  emblem: { src: "/brand/pwfintech-emblem.png", width: 603, height: 342 },
  lockup: { src: "/brand/pwfintech-lockup.png", width: 690, height: 450 },
  full: { src: "/brand/pwfintech-logo-full.jpg", width: 1080, height: 1080 },
  og: "/brand/og-pwfintech.jpg",
};
