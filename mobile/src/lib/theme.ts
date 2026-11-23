/**
 * Palette WorldSoft Transfer, version minimaliste : fond blanc, texte presque noir, gris très doux,
 * bordures fines. « brand » est donc noir ; le bleu n'existe plus que dans le logo.
 */
export const colors = {
  brand: "#0d0d0d",
  brandStrong: "#000000",
  brandSoft: "#f4f4f5",
  navy: "#0d0d0d",
  navyDeep: "#000000",
  sky: "#3fa0ff",
  silver: "#c9d3e6",
  maple: "#e11d2b",
  ink: "#0d0d0d",
  muted: "#6b6b76",
  line: "#ececec",
  bg: "#ffffff",
  white: "#ffffff",
  soft: "#f7f7f8",
  success: "#0e8a59",
  successSoft: "#e3f6ee",
  warn: "#a86a00",
  warnSoft: "#fff3db",
  danger: "#b4141f",
  dangerSoft: "#fdecee",
};

export const fonts = {
  // Inter : titres en 600 (pas plus gras), libellés en 500, texte en 400 — hiérarchie discrète.
  display: "Inter-600",
  heading: "Inter-600",
  semibold: "Inter-500",
  medium: "Inter-500",
  regular: "Inter-400",
};

// Coins plus sobres, comme les cartes du site (12 à 20 px) ; boutons en pilule.
export const radius = { sm: 10, md: 14, lg: 18, xl: 22, pill: 999 };

export const space = (n: number) => n * 4;
