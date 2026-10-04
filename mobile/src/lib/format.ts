const ZERO_DECIMAL = new Set(["XAF", "XOF", "JPY", "KRW"]);

export function money(amount: number, currency: string) {
  const digits = ZERO_DECIMAL.has(currency) ? 0 : 2;
  const n = Number.isFinite(amount) ? amount : 0;
  const fixed = n.toFixed(digits);
  const [int, dec] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const label = currency === "XAF" ? "FCFA" : currency;
  return `${grouped}${dec ? `,${dec}` : ""} ${label}`;
}

export function rate(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (value >= 100) return value.toFixed(2).replace(".", ",");
  return value.toPrecision(4).replace(".", ",");
}

export function parseAmount(text: string) {
  const n = Number(text.replace(/\s| /g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export function dateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const COUNTRY_NAMES: Record<string, string> = { CA: "Canada", CM: "Cameroun", CN: "Chine" };

export function countryName(code: string) {
  return COUNTRY_NAMES[code] ?? code;
}

export const NETWORK_LABELS: Record<string, string> = {
  MTN: "MTN Mobile Money",
  ORANGE: "Orange Money",
  BANK: "Compte bancaire",
  CASH: "Retrait en espèces",
  INTERAC: "Virement Interac",
  ALIPAY: "Alipay",
  WECHAT: "WeChat Pay",
};

export function networkLabel(id: string) {
  return NETWORK_LABELS[id] ?? id;
}

export function etaLabel(estimate: string) {
  const map: Record<string, string> = {
    "A few minutes": "En quelques minutes",
    "Under 24h": "En moins de 24 h",
    "1-2 business days": "1 à 2 jours ouvrables",
  };
  return map[estimate] ?? estimate;
}

export type StatusInfo = { label: string; tone: "brand" | "success" | "warn" | "danger" | "neutral"; step: number };

export function statusInfo(status: string): StatusInfo {
  switch (status) {
    case "awaiting_payment":
      return { label: "En attente de paiement", tone: "warn", step: 0 };
    case "payment_detected":
      return { label: "Paiement reçu", tone: "brand", step: 1 };
    case "payout_queued":
      return { label: "Versement en préparation", tone: "brand", step: 1 };
    case "payout_sent":
      return { label: "Versement envoyé", tone: "brand", step: 2 };
    case "delivered":
      return { label: "Livré", tone: "success", step: 3 };
    case "payment_mismatch":
      return { label: "Montant à vérifier", tone: "danger", step: 1 };
    case "payout_failed":
      return { label: "Échec du versement", tone: "danger", step: 2 };
    case "expired":
      return { label: "Expiré", tone: "neutral", step: 0 };
    case "cancelled":
      return { label: "Annulé", tone: "neutral", step: 0 };
    default:
      return { label: status, tone: "neutral", step: 0 };
  }
}

export const TERMINAL_STATUSES = ["delivered", "payout_failed", "payment_mismatch", "expired", "cancelled"];

const EVENT_TITLES: Record<string, string> = {
  created: "Transfert créé",
  payment_detected: "Paiement détecté",
  payout_queued: "Versement mis en file",
  payout_sent: "Versement transmis",
  payout_accepted: "Versement accepté par l'opérateur",
  delivered: "Livré au destinataire",
  payout_failed: "Échec du versement",
  bank_manual: "Virement bancaire à traiter",
};

export function eventTitle(type: string) {
  return EVENT_TITLES[type] ?? "Mise à jour";
}

/** « 237670000000 » → « +237 670 000 000 » (indicatifs des pays ouverts). */
export function phone(digits: string) {
  const d = digits.replace(/\D/g, "");
  if (!d) return "";
  const dial = ["237", "86", "1"].find((c) => d.startsWith(c)) ?? "";
  const rest = d.slice(dial.length).replace(/(\d{3})(?=\d)/g, "$1 ");
  return dial ? `+${dial} ${rest}` : `+${rest}`;
}
