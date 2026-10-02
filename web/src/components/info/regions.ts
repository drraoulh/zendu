/** Regroupement géographique des destinations (affichage uniquement). */
export type RegionId = "central" | "west" | "east" | "southern" | "north" | "asia" | "caribbean" | "other";

export const REGION_ORDER: RegionId[] = ["central", "west", "east", "southern", "north", "asia", "caribbean", "other"];

export const REGION_OF: Record<string, RegionId> = {
  CM: "central",
  GA: "central",
  CG: "central",
  CD: "central",
  SN: "west",
  CI: "west",
  NG: "west",
  GH: "west",
  ML: "west",
  BF: "west",
  TG: "west",
  BJ: "west",
  KE: "east",
  UG: "east",
  TZ: "east",
  RW: "east",
  ZA: "southern",
  MA: "north",
  IN: "asia",
  PH: "asia",
  HT: "caribbean",
};
