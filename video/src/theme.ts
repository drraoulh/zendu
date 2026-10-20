import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/** Couleurs et police du site et de l'appli WorldSoft Transfer (design « logitech »). */
export const C = {
  ink: "#1b1b1b",
  graphite: "#17181b",
  black: "#000000",
  bg: "#f4f4f5",
  white: "#ffffff",
  muted: "#a1a1aa",
  brand: "#0b4dff",
  sky: "#3fa0ff",
  silver: "#c9d3e6",
  success: "#22c55e",
};

export const FONT = "DM Sans";

export const fontsReady = Promise.all(
  ["400", "500", "600", "700", "800"].map((weight) => loadFont({ family: FONT, url: staticFile(`fonts/DMSans-${weight}.ttf`), weight })),
);
