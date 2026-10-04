import type { CountryCode } from "./corridors";

/** Provinces / régions des pays ouverts (inscription et adresse). */
export const REGIONS: Record<CountryCode, string[]> = {
  CA: [
    "Alberta",
    "Colombie-Britannique",
    "Île-du-Prince-Édouard",
    "Manitoba",
    "Nouveau-Brunswick",
    "Nouvelle-Écosse",
    "Nunavut",
    "Ontario",
    "Québec",
    "Saskatchewan",
    "Terre-Neuve-et-Labrador",
    "Territoires du Nord-Ouest",
    "Yukon",
  ],
  CM: ["Adamaoua", "Centre", "Est", "Extrême-Nord", "Littoral", "Nord", "Nord-Ouest", "Ouest", "Sud", "Sud-Ouest"],
  CN: [
    "Anhui",
    "Chongqing",
    "Fujian",
    "Gansu",
    "Guangdong",
    "Guangxi",
    "Guizhou",
    "Hainan",
    "Hebei",
    "Heilongjiang",
    "Henan",
    "Hubei",
    "Hunan",
    "Jiangsu",
    "Jiangxi",
    "Jilin",
    "Liaoning",
    "Mongolie-Intérieure",
    "Ningxia",
    "Pékin",
    "Qinghai",
    "Shaanxi",
    "Shandong",
    "Shanghai",
    "Shanxi",
    "Sichuan",
    "Tianjin",
    "Tibet",
    "Xinjiang",
    "Yunnan",
    "Zhejiang",
  ],
};

export const REGION_LABEL: Record<CountryCode, string> = { CA: "Province ou territoire", CM: "Région", CN: "Province" };

export const POSTAL_LABEL: Record<CountryCode, string | null> = { CA: "Code postal", CM: null, CN: "Code postal" };

export type KycDocument = { id: string; label: string; description: string; twoSided: boolean };

/** Pièces d'identité acceptées selon le pays de résidence. */
export const KYC_DOCUMENTS: Record<CountryCode, KycDocument[]> = {
  CA: [
    { id: "passport", label: "Passeport", description: "Toutes nationalités", twoSided: false },
    { id: "driver", label: "Permis de conduire", description: "Délivré par une province canadienne", twoSided: true },
    { id: "pr_card", label: "Carte de résident permanent", description: "Résidents permanents du Canada", twoSided: true },
    { id: "provincial_id", label: "Carte d'identité provinciale", description: "Ex. carte avec photo de l'Ontario", twoSided: true },
  ],
  CM: [
    { id: "cni", label: "Carte nationale d'identité", description: "CNI camerounaise en cours de validité", twoSided: true },
    { id: "passport", label: "Passeport", description: "Toutes nationalités", twoSided: false },
    { id: "residence", label: "Carte de séjour", description: "Résidents étrangers au Cameroun", twoSided: true },
  ],
  CN: [
    { id: "passport", label: "Passeport", description: "Toutes nationalités", twoSided: false },
    { id: "resident_id", label: "Carte de résident", description: "Carte de résident permanent ou titre de séjour", twoSided: true },
    { id: "cn_id", label: "Carte d'identité chinoise", description: "居民身份证", twoSided: true },
  ],
};

export const OCCUPATIONS = ["Salarié(e)", "Travailleur(se) autonome", "Étudiant(e)", "Retraité(e)", "Sans emploi", "Autre"];

export const RELATIONS = ["Famille", "Ami", "Entreprise", "Autre"];

/** JJ/MM/AAAA → Date (ou null si invalide). */
export function parseBirthDate(v: string): Date | null {
  const m = /^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/.exec(v.trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  if (d.getDate() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1) return null;
  return d;
}

export function ageFrom(d: Date) {
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

/** Saisie guidée JJ/MM/AAAA. */
export function maskDate(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length < 4) return phone;
  return `${phone.split(" ")[0]} •••• ${d.slice(-2)}`;
}

export function maskEmail(email: string) {
  const [u, dom] = email.split("@");
  if (!dom) return email;
  return `${u[0] ?? ""}••••@${dom}`;
}
