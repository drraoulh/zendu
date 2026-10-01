export const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "PWFINTECH";
export const appFullName =
  process.env.NEXT_PUBLIC_APP_FULL_NAME ?? "Paul World Finances and Technologies";

/** Coordonnées affichées sur le site — à renseigner dans les variables d'environnement. */
export const contact = {
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@pwfintech.ca",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "",
  whatsapp: process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? "",
  city: process.env.NEXT_PUBLIC_CONTACT_CITY ?? "Toronto, Ontario",
  country: "Canada",
};

export const logo = {
  emblem: { src: "/brand/pwfintech-emblem.png", width: 603, height: 342 },
  lockup: { src: "/brand/pwfintech-lockup.png", width: 690, height: 450 },
  full: { src: "/brand/pwfintech-logo-full.jpg", width: 1080, height: 1080 },
  og: "/brand/og-pwfintech.jpg",
};
