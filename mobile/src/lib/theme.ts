/**
 * Palette WorldSoft Transfer : fond blanc, texte presque noir, gris très doux, bordures fines.
 * Le bleu de la marque ne sert qu'à deux choses : l'action principale et l'argent reçu par le proche.
 * Une teinte discrète par pays de destination (vert Cameroun, rouge Chine) aide à reconnaître un bénéficiaire.
 */
export const colors = {
  brand: "#0b4dff",
  brandStrong: "#0a3fd1",
  brandSoft: "#eaf0ff",
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

/** Chiffres de même largeur : les montants s'alignent et ne « dansent » pas pendant la saisie. */
export const tabular = { fontVariant: ["tabular-nums" as const] };

/** Teinte d'un bénéficiaire selon son pays de réception. */
export function countryTone(code?: string | null): { bg: string; fg: string } | null {
  if (code === "CM") return { bg: colors.successSoft, fg: colors.success };
  if (code === "CN") return { bg: colors.dangerSoft, fg: colors.danger };
  return null;
}
