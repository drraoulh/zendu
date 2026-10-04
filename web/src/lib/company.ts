/**
 * Fiche entreprise PWFINTECH — source unique des coordonnées affichées sur le site.
 *
 * Toutes les valeurs viennent de variables d'environnement `NEXT_PUBLIC_COMPANY_*`
 * (lues au build, donc disponibles côté client). Valeur absente ou vide → `null` :
 * le site affiche alors un emplacement « À compléter » (jamais d'information inventée).
 *
 * Les anciennes variables `NEXT_PUBLIC_CONTACT_*` restent acceptées en repli.
 */

/** Anciennes valeurs de l'époque « Zendu » restées dans les variables d'environnement : ignorées. */
export function isLegacyValue(s: string): boolean {
  return /zendu/i.test(s);
}

function v(...values: Array<string | undefined>): string | null {
  for (const value of values) {
    const s = value?.trim();
    if (s && !isLegacyValue(s)) return s;
  }
  return null;
}

export type CompanySocial = {
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  tiktok: string | null;
  x: string | null;
};

export type Company = {
  legalName: string | null;
  brandName: string;
  tagline: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  country: string;
  hours: string | null;
  /** Numéro d'inscription CANAFE (entreprise de services monétaires), lorsqu'il existe. */
  registration: string | null;
  social: CompanySocial;
};

// Accès explicites (process.env.X) : nécessaires pour l'injection NEXT_PUBLIC_* côté client.
export const company: Company = {
  legalName: v(process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME),
  brandName: "PWFINTECH",
  tagline:
    v(process.env.NEXT_PUBLIC_COMPANY_TAGLINE) ?? "Plus qu'un service, une solution pour votre avenir.",
  email: v(process.env.NEXT_PUBLIC_COMPANY_EMAIL, process.env.NEXT_PUBLIC_CONTACT_EMAIL),
  phone: v(process.env.NEXT_PUBLIC_COMPANY_PHONE, process.env.NEXT_PUBLIC_CONTACT_PHONE),
  whatsapp: v(process.env.NEXT_PUBLIC_COMPANY_WHATSAPP, process.env.NEXT_PUBLIC_CONTACT_WHATSAPP),
  address: v(process.env.NEXT_PUBLIC_COMPANY_ADDRESS),
  city: v(process.env.NEXT_PUBLIC_COMPANY_CITY, process.env.NEXT_PUBLIC_CONTACT_CITY),
  province: v(process.env.NEXT_PUBLIC_COMPANY_PROVINCE),
  country: v(process.env.NEXT_PUBLIC_COMPANY_COUNTRY) ?? "Canada",
  hours: v(process.env.NEXT_PUBLIC_COMPANY_HOURS),
  registration: v(process.env.NEXT_PUBLIC_COMPANY_REGISTRATION),
  social: {
    facebook: v(process.env.NEXT_PUBLIC_COMPANY_FACEBOOK),
    instagram: v(process.env.NEXT_PUBLIC_COMPANY_INSTAGRAM),
    linkedin: v(process.env.NEXT_PUBLIC_COMPANY_LINKEDIN),
    tiktok: v(process.env.NEXT_PUBLIC_COMPANY_TIKTOK),
    x: v(process.env.NEXT_PUBLIC_COMPANY_X),
  },
};

export const PLACEHOLDER = "À compléter";

/** La valeur, ou « À compléter » si elle n'est pas renseignée. */
export function display(value: string | null | undefined): string {
  return value && value.trim() ? value : PLACEHOLDER;
}

/**
 * Afficher les emplacements « À compléter » ? Oui par défaut ; mettre
 * `NEXT_PUBLIC_HIDE_PLACEHOLDERS=true` en production pour les masquer.
 */
export const showPlaceholders = process.env.NEXT_PUBLIC_HIDE_PLACEHOLDERS !== "true";

/** « Ville, Province » (ou ce qui est renseigné), sinon null. */
export function companyLocality(c: Company = company): string | null {
  const parts = [c.city, c.province].filter((p): p is string => Boolean(p));
  // La ville peut déjà contenir la province (« Toronto, Ontario »).
  const unique = parts.filter((p, i) => !parts.slice(0, i).some((prev) => prev.includes(p)));
  return unique.length ? unique.join(", ") : null;
}

/** Lien tel: (chiffres et +). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Lien WhatsApp (wa.me) ou null si aucun chiffre. */
export function whatsappHref(whatsapp: string | null): string | null {
  const digits = whatsapp?.replace(/[^\d]/g, "") ?? "";
  return digits ? `https://wa.me/${digits}` : null;
}

/** Réseaux sociaux renseignés uniquement. */
export function socialLinks(c: Company = company): Array<{ id: keyof CompanySocial; label: string; href: string }> {
  const labels: Record<keyof CompanySocial, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    tiktok: "TikTok",
    x: "X",
  };
  return (Object.keys(labels) as Array<keyof CompanySocial>)
    .map((id) => ({ id, label: labels[id], href: c.social[id] }))
    .filter((s): s is { id: keyof CompanySocial; label: string; href: string } => Boolean(s.href));
}
