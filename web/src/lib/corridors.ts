export type PayoutNetwork = {
  id: string;
  label: string;
  type: "mobile_money" | "bank" | "cash";
};

export type Country = {
  code: string;
  name: string;
  flag: string;
  currency: string;
  dialCode: string;
  phoneRegex: RegExp;
  phoneHint: string;
  role: "source" | "destination" | "both";
  networks: PayoutNetwork[];
};

export type Corridor = {
  id: string;
  source: string;
  destination: string;
  active: boolean;
  feeSend: number;
  minSend: number;
  maxSend: number;
  deliveryEstimate: string;
};

const MM = {
  mtn: { id: "MTN", label: "MTN MoMo", type: "mobile_money" as const },
  orange: { id: "ORANGE", label: "Orange Money", type: "mobile_money" as const },
  wave: { id: "WAVE", label: "Wave", type: "mobile_money" as const },
  mpesa: { id: "MPESA", label: "M-Pesa", type: "mobile_money" as const },
  bank: { id: "BANK", label: "Bank account", type: "bank" as const },
  cash: { id: "CASH", label: "Cash pickup", type: "cash" as const },
  vodafone: { id: "VODAFONE", label: "Vodafone Cash", type: "mobile_money" as const },
  airtel: { id: "AIRTEL", label: "Airtel Money", type: "mobile_money" as const },
  interac: { id: "INTERAC", label: "Interac e-Transfer", type: "mobile_money" as const },
  alipay: { id: "ALIPAY", label: "Alipay", type: "mobile_money" as const },
  wechat: { id: "WECHAT", label: "WeChat Pay", type: "mobile_money" as const },
};

/** Catalogue complet ; seuls les pays de ACTIVE_COUNTRY_CODES sont ouverts. */
const ALL_COUNTRIES: Record<string, Country> = {
  CA: {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    currency: "CAD",
    dialCode: "1",
    phoneRegex: /^\d{10,11}$/,
    phoneHint: "Canadian number",
    role: "source",
    networks: [MM.interac, MM.bank],
  },
  US: {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    currency: "USD",
    dialCode: "1",
    phoneRegex: /^\d{10,11}$/,
    phoneHint: "US number",
    role: "source",
    networks: [],
  },
  FR: {
    code: "FR",
    name: "France",
    flag: "🇫🇷",
    currency: "EUR",
    dialCode: "33",
    phoneRegex: /^\d{9,12}$/,
    phoneHint: "French number",
    role: "source",
    networks: [],
  },
  GB: {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    currency: "GBP",
    dialCode: "44",
    phoneRegex: /^\d{10,12}$/,
    phoneHint: "UK number",
    role: "source",
    networks: [],
  },
  CN: {
    code: "CN",
    name: "China",
    flag: "🇨🇳",
    currency: "CNY",
    dialCode: "86",
    phoneRegex: /^\d{11,13}$/,
    phoneHint: "China number",
    role: "source",
    networks: [MM.alipay, MM.wechat, MM.bank],
  },
  DE: {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    currency: "EUR",
    dialCode: "49",
    phoneRegex: /^\d{10,13}$/,
    phoneHint: "German number",
    role: "source",
    networks: [],
  },
  BE: {
    code: "BE",
    name: "Belgium",
    flag: "🇧🇪",
    currency: "EUR",
    dialCode: "32",
    phoneRegex: /^\d{9,12}$/,
    phoneHint: "Belgian number",
    role: "source",
    networks: [],
  },
  IT: {
    code: "IT",
    name: "Italy",
    flag: "🇮🇹",
    currency: "EUR",
    dialCode: "39",
    phoneRegex: /^\d{9,12}$/,
    phoneHint: "Italian number",
    role: "source",
    networks: [],
  },
  ES: {
    code: "ES",
    name: "Spain",
    flag: "🇪🇸",
    currency: "EUR",
    dialCode: "34",
    phoneRegex: /^\d{9,12}$/,
    phoneHint: "Spanish number",
    role: "source",
    networks: [],
  },
  AE: {
    code: "AE",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    currency: "AED",
    dialCode: "971",
    phoneRegex: /^(971)?5\d{8}$/,
    phoneHint: "UAE number",
    role: "source",
    networks: [],
  },
  CM: {
    code: "CM",
    name: "Cameroon",
    flag: "🇨🇲",
    currency: "XAF",
    dialCode: "237",
    phoneRegex: /^(237)?6\d{8}$/,
    phoneHint: "Ex: 2376XXXXXXXX",
    role: "destination",
    networks: [MM.mtn, MM.orange, MM.bank, MM.cash],
  },
  SN: {
    code: "SN",
    name: "Senegal",
    flag: "🇸🇳",
    currency: "XOF",
    dialCode: "221",
    phoneRegex: /^(221)?7\d{8}$/,
    phoneHint: "Ex: 2217XXXXXXXX",
    role: "destination",
    networks: [MM.orange, MM.wave, MM.bank, MM.cash],
  },
  CI: {
    code: "CI",
    name: "Côte d'Ivoire",
    flag: "🇨🇮",
    currency: "XOF",
    dialCode: "225",
    phoneRegex: /^(225)?0?\d{9,10}$/,
    phoneHint: "Ex: 22507XXXXXXXX",
    role: "destination",
    networks: [MM.mtn, MM.orange, MM.wave, MM.bank, MM.cash],
  },
  NG: {
    code: "NG",
    name: "Nigeria",
    flag: "🇳🇬",
    currency: "NGN",
    dialCode: "234",
    phoneRegex: /^(234)?[789]\d{9}$/,
    phoneHint: "Ex: 234801XXXXXXX",
    role: "destination",
    networks: [MM.bank, MM.mtn, MM.cash],
  },
  GH: {
    code: "GH",
    name: "Ghana",
    flag: "🇬🇭",
    currency: "GHS",
    dialCode: "233",
    phoneRegex: /^(233)?0?\d{9}$/,
    phoneHint: "Ex: 23324XXXXXXX",
    role: "destination",
    networks: [MM.mtn, MM.vodafone, MM.bank, MM.cash],
  },
  KE: {
    code: "KE",
    name: "Kenya",
    flag: "🇰🇪",
    currency: "KES",
    dialCode: "254",
    phoneRegex: /^(254)?7\d{8}$/,
    phoneHint: "Ex: 2547XXXXXXXX",
    role: "destination",
    networks: [MM.mpesa, MM.airtel, MM.bank],
  },
  UG: {
    code: "UG",
    name: "Uganda",
    flag: "🇺🇬",
    currency: "UGX",
    dialCode: "256",
    phoneRegex: /^(256)?7\d{8}$/,
    phoneHint: "Ex: 2567XXXXXXXX",
    role: "destination",
    networks: [MM.mtn, MM.airtel, MM.bank, MM.cash],
  },
  TZ: {
    code: "TZ",
    name: "Tanzania",
    flag: "🇹🇿",
    currency: "TZS",
    dialCode: "255",
    phoneRegex: /^(255)?[67]\d{8}$/,
    phoneHint: "Ex: 2557XXXXXXXX",
    role: "destination",
    networks: [MM.mpesa, MM.airtel, MM.bank, MM.cash],
  },
  ZA: {
    code: "ZA",
    name: "South Africa",
    flag: "🇿🇦",
    currency: "ZAR",
    dialCode: "27",
    phoneRegex: /^(27)?0?\d{9}$/,
    phoneHint: "Ex: 2782XXXXXXX",
    role: "destination",
    networks: [MM.bank, MM.cash],
  },
  CD: {
    code: "CD",
    name: "DR Congo",
    flag: "🇨🇩",
    currency: "CDF",
    dialCode: "243",
    phoneRegex: /^(243)?0?\d{9}$/,
    phoneHint: "Ex: 2438XXXXXXXX",
    role: "destination",
    networks: [MM.orange, MM.airtel, MM.bank, MM.cash],
  },
  ML: {
    code: "ML",
    name: "Mali",
    flag: "🇲🇱",
    currency: "XOF",
    dialCode: "223",
    phoneRegex: /^(223)?\d{8}$/,
    phoneHint: "Ex: 2237XXXXXXX",
    role: "destination",
    networks: [MM.orange, MM.wave, MM.bank, MM.cash],
  },
  BF: {
    code: "BF",
    name: "Burkina Faso",
    flag: "🇧🇫",
    currency: "XOF",
    dialCode: "226",
    phoneRegex: /^(226)?\d{8}$/,
    phoneHint: "Ex: 2267XXXXXXX",
    role: "destination",
    networks: [MM.orange, MM.wave, MM.bank, MM.cash],
  },
  TG: {
    code: "TG",
    name: "Togo",
    flag: "🇹🇬",
    currency: "XOF",
    dialCode: "228",
    phoneRegex: /^(228)?\d{8}$/,
    phoneHint: "Ex: 2289XXXXXXX",
    role: "destination",
    networks: [MM.mtn, MM.wave, MM.bank, MM.cash],
  },
  BJ: {
    code: "BJ",
    name: "Benin",
    flag: "🇧🇯",
    currency: "XOF",
    dialCode: "229",
    phoneRegex: /^(229)?\d{8,10}$/,
    phoneHint: "Ex: 2299XXXXXXX",
    role: "destination",
    networks: [MM.mtn, MM.orange, MM.bank, MM.cash],
  },
  GA: {
    code: "GA",
    name: "Gabon",
    flag: "🇬🇦",
    currency: "XAF",
    dialCode: "241",
    phoneRegex: /^(241)?0?\d{7,8}$/,
    phoneHint: "Ex: 2410XXXXXXX",
    role: "destination",
    networks: [MM.airtel, MM.bank, MM.cash],
  },
  CG: {
    code: "CG",
    name: "Congo",
    flag: "🇨🇬",
    currency: "XAF",
    dialCode: "242",
    phoneRegex: /^(242)?0?\d{8,9}$/,
    phoneHint: "Ex: 2420XXXXXXX",
    role: "destination",
    networks: [MM.mtn, MM.airtel, MM.bank, MM.cash],
  },
  RW: {
    code: "RW",
    name: "Rwanda",
    flag: "🇷🇼",
    currency: "RWF",
    dialCode: "250",
    phoneRegex: /^(250)?7\d{8}$/,
    phoneHint: "Ex: 2507XXXXXXXX",
    role: "destination",
    networks: [MM.mtn, MM.airtel, MM.bank, MM.cash],
  },
  MA: {
    code: "MA",
    name: "Morocco",
    flag: "🇲🇦",
    currency: "MAD",
    dialCode: "212",
    phoneRegex: /^(212)?0?[67]\d{8}$/,
    phoneHint: "Ex: 2126XXXXXXXX",
    role: "destination",
    networks: [MM.bank, MM.cash],
  },
  IN: {
    code: "IN",
    name: "India",
    flag: "🇮🇳",
    currency: "INR",
    dialCode: "91",
    phoneRegex: /^(91)?[6-9]\d{9}$/,
    phoneHint: "Ex: 9198XXXXXXXX",
    role: "destination",
    networks: [MM.bank, MM.cash],
  },
  PH: {
    code: "PH",
    name: "Philippines",
    flag: "🇵🇭",
    currency: "PHP",
    dialCode: "63",
    phoneRegex: /^(63)?9\d{9}$/,
    phoneHint: "Ex: 63917XXXXXXX",
    role: "destination",
    networks: [MM.bank, MM.cash],
  },
  HT: {
    code: "HT",
    name: "Haiti",
    flag: "🇭🇹",
    currency: "HTG",
    dialCode: "509",
    phoneRegex: /^(509)?\d{8}$/,
    phoneHint: "Ex: 5093XXXXXXX",
    role: "destination",
    networks: [MM.cash, MM.bank],
  },
};

/**
 * Pays ouverts pour le moment : Canada, Cameroun, Chine (modifiable par
 * NEXT_PUBLIC_ACTIVE_COUNTRIES, ex. "CA,CM,CN"). Chaque pays ouvert peut envoyer
 * vers les autres et en recevoir.
 */
export const ACTIVE_COUNTRY_CODES: string[] = (process.env.NEXT_PUBLIC_ACTIVE_COUNTRIES ?? "CA,CM,CN")
  .split(",")
  .map((c) => c.trim().toUpperCase())
  .filter((c) => c in ALL_COUNTRIES);

export const COUNTRIES: Record<string, Country> = Object.fromEntries(
  ACTIVE_COUNTRY_CODES.map((code) => [code, { ...ALL_COUNTRIES[code], role: "both" as const }]),
);

/** Montants min/max par devise d'envoi. */
const LIMITS: Record<string, { min: number; max: number }> = {
  CAD: { min: 10, max: 5000 },
  XAF: { min: 5000, max: 3_000_000 },
  CNY: { min: 50, max: 30_000 },
};

/** Délai indicatif selon le pays de réception (traduit côté UI). */
function estimateFor(destination: string): string {
  if (destination === "CM") return "A few minutes";
  return "Under 24h";
}

export const CORRIDORS: Corridor[] = ACTIVE_COUNTRY_CODES.flatMap((source) =>
  ACTIVE_COUNTRY_CODES.filter((destination) => destination !== source).map((destination) => {
    const limits = LIMITS[ALL_COUNTRIES[source].currency] ?? { min: 10, max: 5000 };
    return {
      id: `${source}-${destination}`,
      source,
      destination,
      active: true,
      feeSend: 0,
      minSend: limits.min,
      maxSend: limits.max,
      deliveryEstimate: estimateFor(destination),
    };
  }),
);

/** Corridor par défaut (et premier corridor proposé depuis un pays). */
export const DEFAULT_CORRIDOR_ID = "CA-CM";

export function corridorsFrom(source: string): Corridor[] {
  return CORRIDORS.filter((c) => c.source === source && c.active);
}

export function corridorsTo(destination: string): Corridor[] {
  return CORRIDORS.filter((c) => c.destination === destination && c.active);
}

export function isActiveCountry(code: string): boolean {
  return ACTIVE_COUNTRY_CODES.includes(code.toUpperCase());
}

export function getCorridor(id: string): Corridor | undefined {
  return CORRIDORS.find((c) => c.id === id);
}

export function getActiveCorridors(): Corridor[] {
  return CORRIDORS.filter((c) => c.active);
}

export function getCountry(code: string): Country {
  const c = COUNTRIES[code] ?? ALL_COUNTRIES[code];
  if (!c) throw new Error(`Unknown country: ${code}`);
  return c;
}

export function getSourceCountries(): Country[] {
  return Object.values(COUNTRIES).filter((c) => c.role === "source" || c.role === "both");
}

export function getDestinationCountries(): Country[] {
  return Object.values(COUNTRIES).filter((c) => c.role === "destination" || c.role === "both");
}

export function normalizePhone(phone: string, countryCode: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  const country = getCountry(countryCode);
  if (digits.startsWith(country.dialCode)) return digits;
  return `${country.dialCode}${digits.replace(/^0+/, "")}`;
}

export function validatePhone(phone: string, countryCode: string): string | null {
  const normalized = normalizePhone(phone, countryCode);
  const country = getCountry(countryCode);
  if (!country.phoneRegex.test(normalized)) {
    return `Invalid number for ${country.name}. ${country.phoneHint}`;
  }
  return null;
}

export function corridorLabel(corridor: Corridor): string {
  const from = getCountry(corridor.source);
  const to = getCountry(corridor.destination);
  return `${from.flag} ${from.name} → ${to.flag} ${to.name}`;
}
