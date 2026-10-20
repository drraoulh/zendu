/**
 * Palette WorldSoft Transfer, identique au site (esprit logitech.com) : texte presque noir, gris neutres,
 * sections sombres graphite ; le bleu du logo reste la couleur d'accent.
 */
export const colors = {
  brand: "#0b4dff",
  brandStrong: "#0637c9",
  brandSoft: "#e8eeff",
  navy: "#17181b",
  navyDeep: "#000000",
  sky: "#3fa0ff",
  silver: "#c9d3e6",
  maple: "#e11d2b",
  ink: "#1b1b1b",
  muted: "#6b6d73",
  line: "#e4e4e7",
  bg: "#f4f4f5",
  white: "#ffffff",
  success: "#0e8a59",
  successSoft: "#e3f6ee",
  warn: "#a86a00",
  warnSoft: "#fff3db",
  danger: "#b4141f",
  dangerSoft: "#fdecee",
};

export const fonts = {
  // DM Sans, comme le site : titres francs (800), sous-titres (700), libellés (600), texte (400).
  display: "DMSans-800",
  heading: "DMSans-700",
  semibold: "DMSans-600",
  medium: "DMSans-500",
  regular: "DMSans-400",
};

// Coins plus sobres, comme les cartes du site (12 à 20 px) ; boutons en pilule.
export const radius = { sm: 10, md: 14, lg: 18, xl: 22, pill: 999 };

export const space = (n: number) => n * 4;
