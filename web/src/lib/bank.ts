import { COUNTRIES, type PayoutNetwork } from "@/lib/corridors";

/** Code de délai (traduit côté UI) pour un versement sur compte bancaire. */
export const BANK_DELIVERY_ESTIMATE = "1-2 business days";

/** Fournisseurs de versement bancaire enregistrés dans Transfer.payoutProvider. */
export const MOCK_BANK_PROVIDER = "mock_bank";
export const MANUAL_BANK_PROVIDER = "manual_bank";

/** Type du réseau de réception (mobile_money / bank / cash) pour un pays donné. */
export function networkType(networkId: string, countryCode?: string | null): PayoutNetwork["type"] {
  const fromCountry = countryCode
    ? COUNTRIES[countryCode]?.networks.find((n) => n.id === networkId)?.type
    : undefined;
  if (fromCountry) return fromCountry;
  if (networkId === "BANK") return "bank";
  if (networkId === "CASH") return "cash";
  return "mobile_money";
}

export function isBankNetwork(networkId: string, countryCode?: string | null): boolean {
  return networkType(networkId, countryCode) === "bank";
}

/** Délai à afficher : délai du corridor, sauf pour un virement bancaire. */
export function deliveryEstimateFor(
  corridorEstimate: string,
  networkId: string | null | undefined,
  countryCode?: string | null,
): string {
  return networkId && isBankNetwork(networkId, countryCode) ? BANK_DELIVERY_ESTIMATE : corridorEstimate;
}

/** IBAN / RIB / numéro de compte : espaces, tirets et points retirés, majuscules. */
export function normalizeAccountNumber(raw: string): string {
  return raw.replace(/[\s.\-_/]/g, "").toUpperCase();
}

export function normalizeBankCode(raw: string): string {
  return raw.replace(/[\s.\-]/g, "").toUpperCase();
}

/** 6 à 34 caractères alphanumériques (34 = longueur maximale d'un IBAN). */
export const ACCOUNT_NUMBER_REGEX = /^[A-Z0-9]{6,34}$/;
/** SWIFT/BIC (8 ou 11), code banque/agence ou IFSC : 3 à 11 caractères alphanumériques. */
export const BANK_CODE_REGEX = /^[A-Z0-9]{3,11}$/;

export function isValidAccountNumber(raw: string): boolean {
  return ACCOUNT_NUMBER_REGEX.test(normalizeAccountNumber(raw));
}

export function isValidBankCode(raw: string): boolean {
  const v = normalizeBankCode(raw);
  return v === "" || BANK_CODE_REGEX.test(v);
}

/** « •••• 1234 » — jamais le numéro complet dans une vue publique. */
export function maskAccount(accountNumber: string | null | undefined): string | null {
  if (!accountNumber) return null;
  const clean = normalizeAccountNumber(accountNumber);
  return `•••• ${clean.slice(-4)}`;
}

/**
 * Bénéficiaire tel qu'exposé par les API publiques : le numéro de compte complet est
 * remplacé par `accountMasked`.
 */
export function publicBeneficiary<T extends { accountNumber?: string | null }>(
  beneficiary: T,
): Omit<T, "accountNumber"> & { accountMasked: string | null } {
  const { accountNumber, ...rest } = beneficiary;
  return { ...rest, accountMasked: maskAccount(accountNumber) };
}

/** Transfert (avec bénéficiaire inclus) prêt à être renvoyé par une API publique. */
export function publicTransfer<T extends { beneficiary: { accountNumber?: string | null } }>(transfer: T) {
  return { ...transfer, beneficiary: publicBeneficiary(transfer.beneficiary) };
}

/**
 * Banques courantes par pays de destination — simples suggestions (datalist),
 * le champ reste libre.
 */
export const BANK_SUGGESTIONS: Record<string, string[]> = {
  CA: ["RBC Banque Royale", "TD Canada Trust", "Banque Scotia", "BMO Banque de Montréal", "CIBC", "Banque Nationale", "Desjardins"],
  CN: ["Bank of China", "ICBC", "China Construction Bank", "Agricultural Bank of China", "Bank of Communications", "China Merchants Bank"],
  CM: [
    "Afriland First Bank",
    "BICEC",
    "Société Générale Cameroun (SGC)",
    "SCB Cameroun",
    "Ecobank Cameroun",
    "UBA Cameroun",
    "CCA Bank",
    "Banque Atlantique Cameroun",
  ],
  SN: [
    "CBAO Groupe Attijariwafa bank",
    "Société Générale Sénégal",
    "Ecobank Sénégal",
    "Bank of Africa Sénégal",
    "Banque Atlantique Sénégal",
    "UBA Sénégal",
  ],
  CI: [
    "Société Générale Côte d'Ivoire",
    "SIB",
    "NSIA Banque",
    "Ecobank Côte d'Ivoire",
    "BICICI",
    "Banque Atlantique Côte d'Ivoire",
    "Bank of Africa Côte d'Ivoire",
  ],
  NG: [
    "Access Bank",
    "Zenith Bank",
    "Guaranty Trust Bank (GTBank)",
    "First Bank of Nigeria",
    "United Bank for Africa (UBA)",
    "Ecobank Nigeria",
    "Stanbic IBTC Bank",
    "Fidelity Bank",
  ],
  GH: [
    "GCB Bank",
    "Ecobank Ghana",
    "Stanbic Bank Ghana",
    "Absa Bank Ghana",
    "Fidelity Bank Ghana",
    "CalBank",
    "Standard Chartered Ghana",
  ],
  KE: [
    "Equity Bank",
    "KCB Bank",
    "Co-operative Bank of Kenya",
    "NCBA Bank",
    "Absa Bank Kenya",
    "Standard Chartered Kenya",
    "Stanbic Bank Kenya",
  ],
  UG: ["Stanbic Bank Uganda", "Centenary Bank", "dfcu Bank", "Absa Bank Uganda", "Equity Bank Uganda"],
  TZ: ["CRDB Bank", "NMB Bank", "NBC Bank", "Stanbic Bank Tanzania"],
  ZA: ["Standard Bank", "FNB", "Absa", "Nedbank", "Capitec Bank"],
  CD: ["Rawbank", "Equity BCDC", "Ecobank RDC", "Access Bank RDC"],
  ML: ["BDM-SA", "Ecobank Mali", "Bank of Africa Mali", "BMS-SA"],
  BF: ["Coris Bank International", "Ecobank Burkina", "Bank of Africa Burkina Faso", "UBA Burkina Faso"],
  TG: ["Ecobank Togo", "Orabank Togo", "UTB (Union Togolaise de Banque)", "Coris Bank International Togo"],
  BJ: ["Ecobank Bénin", "Bank of Africa Bénin", "Orabank Bénin", "UBA Bénin"],
  GA: ["BGFIBank Gabon", "Ecobank Gabon", "UBA Gabon", "BICIG"],
  CG: ["BGFIBank Congo", "LCB Bank", "Ecobank Congo", "UBA Congo"],
  RW: ["Bank of Kigali", "Equity Bank Rwanda", "I&M Bank Rwanda", "Ecobank Rwanda", "BPR Bank Rwanda"],
  MA: ["Attijariwafa bank", "Banque Populaire", "Bank of Africa", "CIH Bank", "Crédit du Maroc"],
  IN: ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Punjab National Bank", "Kotak Mahindra Bank"],
  PH: ["BDO Unibank", "BPI", "Metrobank", "Landbank", "Security Bank", "UnionBank"],
  HT: ["Unibank", "Sogebank", "BNC (Banque Nationale de Crédit)", "Capital Bank"],
};
