import type { SavedCard } from "./store";

export function cardBrand(number: string): SavedCard["brand"] {
  const d = number.replace(/\D/g, "");
  if (/^4/.test(d)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  return "Carte";
}

export function luhn(number: string) {
  const d = number.replace(/\D/g, "");
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

export function formatCardNumber(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function expiryValid(v: string) {
  const m = /^(\d{2})\/(\d{2})$/.exec(v);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

export function cardLabel(c: SavedCard) {
  return `${c.brand} •••• ${c.last4}`;
}

/**
 * Lit un texte collé ou rempli automatiquement (numéro, éventuellement suivi de l'expiration) :
 * « 4242 4242 4242 4242 08/29 » → { number: "4242424242424242", exp: "08/29" }.
 */
export function parseCardText(text: string): { number?: string; exp?: string } {
  const out: { number?: string; exp?: string } = {};
  // La date d'abord (MM/AA ou MM/AAAA, séparée du numéro par un espace) : sinon ses chiffres seraient
  // pris pour la fin du numéro.
  const exp = /(?:^|\s)(0[1-9]|1[0-2])\s*[/\-.]\s*(\d{4}|\d{2})(?!\d)/.exec(text);
  let rest = text;
  if (exp) {
    out.exp = `${exp[1]}/${exp[2].slice(-2)}`;
    rest = text.slice(0, exp.index) + " " + text.slice(exp.index + exp[0].length);
  }
  const num = /\d(?:[ -]?\d){12,18}/.exec(rest);
  if (num) {
    const digits = num[0].replace(/\D/g, "");
    if (digits.length >= 13 && digits.length <= 19) out.number = digits;
  }
  return out;
}

/** Longueur attendue du numéro selon la marque (Amex 15, autres 16). */
export function expectedLength(number: string) {
  return cardBrand(number) === "Amex" ? 15 : 16;
}

/** Confusions fréquentes de la reconnaissance de texte sur les chiffres embossés. */
const OCR_DIGIT: Record<string, string> = { O: "0", o: "0", D: "0", Q: "0", I: "1", l: "1", "|": "1", Z: "2", S: "5", s: "5", B: "8", G: "6", b: "6" };
const NOT_A_NAME =
  /\b(VALID|THRU|FROM|UNTIL|EXP|EXPIRES?|MONTH|YEAR|DEBIT|CREDIT|CARD|CARTE|VISA|MASTERCARD|AMERICAN|EXPRESS|BANK|BANQUE|MEMBER|SINCE|PLATINUM|GOLD|CLASSIC|WORLD|ELITE|INFINITE|SIGNATURE|BUSINESS|PREPAID|INTERNATIONAL|ELECTRONIC|USE|ONLY|CLIENT|DESJARDINS|RBC|TD|BMO|SCOTIA|CIBC|NATIONALE|AFRILAND|ECOBANK|SGC|UBA|BICEC|SCB|CHINA|UNIONPAY)\b/;

/**
 * Lit les textes reconnus sur la photo d'une carte (une entrée par bloc) :
 * numéro (contrôlé par Luhn), expiration (la plus lointaine si « valide du … au … ») et titulaire.
 */
export function parseScannedCard(blocks: string[]): { number?: string; exp?: string; holder?: string } {
  const lines = blocks.flatMap((b) => b.split(/\n/)).map((l) => l.trim()).filter(Boolean);
  const out: { number?: string; exp?: string; holder?: string } = {};

  // Numéro : on corrige les lettres prises pour des chiffres, puis on garde le premier numéro valide,
  // d'abord ligne par ligne, puis sur le texte entier (numéro coupé en plusieurs blocs).
  const fix = (s: string) => s.replace(/[OoDQIl|ZSsBGb]/g, (ch) => OCR_DIGIT[ch] ?? ch);
  for (const candidate of [...lines, lines.join(" ")]) {
    for (const m of fix(candidate).matchAll(/\d(?:[ -]?\d){12,18}/g)) {
      const digits = m[0].replace(/\D/g, "");
      if (luhn(digits)) {
        out.number = digits;
        break;
      }
    }
    if (out.number) break;
  }

  const dates = [...fix(lines.join(" ")).matchAll(/(?<!\d)(0[1-9]|1[0-2])\s?[/\-.]\s?(\d{4}|\d{2})(?!\d)/g)].map((m) => `${m[1]}/${m[2].slice(-2)}`);
  const latest = dates.sort((a, b) => Number(a.slice(3) + a.slice(0, 2)) - Number(b.slice(3) + b.slice(0, 2))).pop();
  if (latest) out.exp = latest;

  const holder = lines.find((l) => /^[A-ZÀ-Ý][A-ZÀ-Ý' .-]{3,}$/.test(l) && /\s/.test(l) && !NOT_A_NAME.test(l));
  if (holder) out.holder = holder.replace(/\s+/g, " ");
  return out;
}
