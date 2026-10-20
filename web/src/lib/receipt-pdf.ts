import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { appFullName, contact } from "@/lib/brand";
import { company } from "@/lib/company";
import { formatMoney } from "@/lib/money";
import type { ReceiptData } from "@/lib/receipt";

/** Langues du reçu PDF. Le chinois demande une police CJK embarquée : il retombe sur l'anglais. */
export type ReceiptPdfLang = "fr" | "en" | "es";

export function receiptPdfLang(raw: string | null | undefined): ReceiptPdfLang {
  const l = (raw ?? "").toLowerCase().slice(0, 2);
  return l === "en" || l === "es" ? l : l === "zh" ? "en" : "fr";
}

const L = {
  fr: {
    title: "Reçu de transfert",
    solution: "une solution PWFINTECH",
    reference: "Numéro de confirmation",
    status: "Statut",
    created: "Créé le",
    paid: "Paiement reçu le",
    delivered: "Livré le",
    sender: "Expéditeur",
    recipient: "Destinataire",
    method: "Mode de réception",
    account: "Compte",
    bank: "Banque",
    phone: "Téléphone",
    country: "Pays",
    amounts: "Montants",
    sent: "Montant envoyé",
    fee: "Frais",
    total: "Total payé",
    rate: "Taux de change",
    received: "Montant reçu",
    payoutRef: "Référence de versement",
    eta: "Délai de livraison estimé",
    support: "Service client",
    keep: "Conservez ce reçu. Pour toute question, contactez-nous en citant le numéro de confirmation.",
    generated: "Document généré électroniquement le",
    page: "Reçu",
    statuses: {
      draft: "Brouillon",
      quoted: "Devis",
      awaiting_payment: "En attente de paiement",
      payment_detected: "Paiement reçu",
      payout_queued: "Versement en préparation",
      payout_sent: "Versement en cours",
      delivered: "Livré",
      payment_mismatch: "Paiement non conforme",
      payout_failed: "Échec du versement",
      expired: "Expiré",
      cancelled: "Annulé",
    },
    etas: { "A few minutes": "Quelques minutes", "Under 24h": "Moins de 24 h", "1-2 business days": "1 à 2 jours ouvrables" },
    methods: { "MTN Mobile Money": "MTN Mobile Money", "Orange Money": "Orange Money", "Virement bancaire": "Virement bancaire" },
    locale: "fr-CA",
  },
  en: {
    title: "Transfer receipt",
    solution: "a PWFINTECH solution",
    reference: "Confirmation number",
    status: "Status",
    created: "Created",
    paid: "Payment received",
    delivered: "Delivered",
    sender: "Sender",
    recipient: "Recipient",
    method: "Delivery method",
    account: "Account",
    bank: "Bank",
    phone: "Phone",
    country: "Country",
    amounts: "Amounts",
    sent: "Amount sent",
    fee: "Fees",
    total: "Total paid",
    rate: "Exchange rate",
    received: "Amount received",
    payoutRef: "Payout reference",
    eta: "Estimated delivery time",
    support: "Customer support",
    keep: "Keep this receipt for your records. If you have any questions, contact us quoting the confirmation number.",
    generated: "Electronically generated on",
    page: "Receipt",
    statuses: {
      draft: "Draft",
      quoted: "Quoted",
      awaiting_payment: "Awaiting payment",
      payment_detected: "Payment received",
      payout_queued: "Payout being prepared",
      payout_sent: "Payout in progress",
      delivered: "Delivered",
      payment_mismatch: "Payment mismatch",
      payout_failed: "Payout failed",
      expired: "Expired",
      cancelled: "Cancelled",
    },
    etas: { "A few minutes": "A few minutes", "Under 24h": "Under 24h", "1-2 business days": "1–2 business days" },
    methods: { "MTN Mobile Money": "MTN Mobile Money", "Orange Money": "Orange Money", "Virement bancaire": "Bank transfer" },
    locale: "en-CA",
  },
  es: {
    title: "Recibo de envío",
    solution: "una solución PWFINTECH",
    reference: "Número de confirmación",
    status: "Estado",
    created: "Creado el",
    paid: "Pago recibido el",
    delivered: "Entregado el",
    sender: "Remitente",
    recipient: "Destinatario",
    method: "Método de entrega",
    account: "Cuenta",
    bank: "Banco",
    phone: "Teléfono",
    country: "País",
    amounts: "Importes",
    sent: "Importe enviado",
    fee: "Comisión",
    total: "Total pagado",
    rate: "Tipo de cambio",
    received: "Importe recibido",
    payoutRef: "Referencia de pago",
    eta: "Plazo de entrega estimado",
    support: "Atención al cliente",
    keep: "Conserve este recibo. Si tiene alguna pregunta, contáctenos indicando el número de confirmación.",
    generated: "Documento generado electrónicamente el",
    page: "Recibo",
    statuses: {
      draft: "Borrador",
      quoted: "Cotizado",
      awaiting_payment: "Pendiente de pago",
      payment_detected: "Pago recibido",
      payout_queued: "Pago en preparación",
      payout_sent: "Pago en curso",
      delivered: "Entregado",
      payment_mismatch: "Pago no conforme",
      payout_failed: "Pago fallido",
      expired: "Caducado",
      cancelled: "Cancelado",
    },
    etas: { "A few minutes": "Unos minutos", "Under 24h": "Menos de 24 h", "1-2 business days": "1 a 2 días hábiles" },
    methods: { "MTN Mobile Money": "MTN Mobile Money", "Orange Money": "Orange Money", "Virement bancaire": "Transferencia bancaria" },
    locale: "es",
  },
} as const;

const NAVY = rgb(0.043, 0.122, 0.239);
const INK = rgb(0.11, 0.14, 0.2);
const MUTED = rgb(0.42, 0.46, 0.53);
const LINE = rgb(0.88, 0.9, 0.93);
const SOFT = rgb(0.96, 0.97, 0.98);
const GREEN = rgb(0.05, 0.55, 0.33);

let logoCache: Uint8Array | null | undefined;
async function logo(): Promise<Uint8Array | null> {
  if (logoCache !== undefined) return logoCache;
  try {
    logoCache = new Uint8Array(await readFile(path.join(process.cwd(), "public/brand/wst/logo-horizontal@2x.png")));
  } catch {
    logoCache = null;
  }
  return logoCache;
}

/**
 * Les polices standard du PDF (WinAnsi) ne couvrent pas tout Unicode : espaces fines insérées par
 * Intl, flèches, etc. On remplace ces caractères par un équivalent, ou on les retire.
 */
function safe(font: PDFFont, text: string): string {
  const supported = new Set(font.getCharacterSet());
  const mapped = text
    .replace(/[    ]/g, " ")
    .replace(/[→]/g, "->")
    .replace(/[‐-‒]/g, "-");
  let out = "";
  for (const ch of mapped) {
    const cp = ch.codePointAt(0)!;
    out += supported.has(cp) || ch === " " ? ch : "?";
  }
  return out;
}

function dateText(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short", timeZone: "America/Toronto" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Coupe un texte en lignes qui tiennent dans `width`. */
function wrap(font: PDFFont, text: string, size: number, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > width && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export type ReceiptPdfOptions = {
  lang: ReceiptPdfLang;
  /** Accès public par lien : coordonnées déjà masquées en amont. */
  limited?: boolean;
};

/** Reçu de transfert en PDF A4 (logo, montants, référence de versement, contact du service client). */
export async function renderReceiptPdf(receipt: ReceiptData, { lang }: ReceiptPdfOptions): Promise<Uint8Array> {
  const t = L[lang];
  const doc = await PDFDocument.create();
  doc.setTitle(`${t.title} ${receipt.reference}`);
  doc.setAuthor("PWFINTECH");
  doc.setCreator("WorldSoft Transfer");
  doc.setProducer("WorldSoft Transfer");
  doc.setLanguage(lang);

  const page = doc.addPage([595.28, 841.89]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const M = 48;
  const W = width - M * 2;
  let y = height - M;

  const text = (p: PDFPage, s: string, x: number, yy: number, size: number, font: PDFFont, color = INK) =>
    p.drawText(safe(font, s), { x, y: yy, size, font, color });
  const right = (s: string, yy: number, size: number, font: PDFFont, color = INK, edge = M + W) => {
    const v = safe(font, s);
    page.drawText(v, { x: edge - font.widthOfTextAtSize(v, size), y: yy, size, font, color });
  };

  // En-tête : logo + titre.
  const png = await logo();
  if (png) {
    try {
      const img = await doc.embedPng(png);
      const h = 26;
      page.drawImage(img, { x: M, y: y - h, width: (img.width / img.height) * h, height: h });
    } catch {
      text(page, "WorldSoft Transfer", M, y - 20, 18, bold, NAVY);
    }
  } else {
    text(page, "WorldSoft Transfer", M, y - 20, 18, bold, NAVY);
  }
  right(t.title, y - 12, 14, bold, NAVY);
  right(t.solution, y - 28, 9, regular, MUTED);
  y -= 50;
  page.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 1, color: LINE });
  y -= 28;

  // Bloc principal : montant reçu + référence + statut.
  const status = (t.statuses as Record<string, string>)[receipt.status] ?? receipt.statusLabel;
  page.drawRectangle({ x: M, y: y - 74, width: W, height: 86, color: SOFT });
  text(page, t.received, M + 16, y - 8, 9, regular, MUTED);
  text(page, formatMoney(receipt.receiveAmount, receipt.receiveCurrency, t.locale), M + 16, y - 34, 24, bold, NAVY);
  text(page, `${receipt.sourceCountryName} – ${receipt.destCountryName}`, M + 16, y - 56, 10, regular, MUTED);
  right(t.reference, y - 8, 9, regular, MUTED, M + W - 16);
  right(receipt.confirmationNumber, y - 26, 14, bold, INK, M + W - 16);
  right(status, y - 50, 11, bold, receipt.status === "delivered" ? GREEN : INK, M + W - 16);
  y -= 104;

  const section = (title: string) => {
    text(page, title.toUpperCase(), M, y, 9, bold, MUTED);
    y -= 8;
    page.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 0.75, color: LINE });
    y -= 18;
  };
  const row = (label: string, value: string | null | undefined, strong = false) => {
    if (!value) return;
    text(page, label, M, y, 10, regular, MUTED);
    const lines = wrap(strong ? bold : regular, safe(strong ? bold : regular, value), 10, W * 0.6);
    lines.forEach((l, i) => right(l, y - i * 13, 10, strong ? bold : regular, INK));
    y -= 13 * lines.length + 7;
  };

  section(t.amounts);
  row(t.sent, formatMoney(receipt.sendAmount, receipt.sendCurrency, t.locale));
  row(t.fee, formatMoney(receipt.fee, receipt.sendCurrency, t.locale));
  row(t.total, formatMoney(receipt.total, receipt.sendCurrency, t.locale), true);
  row(t.rate, `1 ${receipt.sendCurrency} = ${receipt.rate.toLocaleString(t.locale, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${receipt.receiveCurrency}`);
  row(t.received, formatMoney(receipt.receiveAmount, receipt.receiveCurrency, t.locale), true);
  y -= 10;

  section(t.sender);
  row(t.sender, receipt.sender.name);
  row("Email", receipt.sender.email);
  row(t.country, receipt.sourceCountryName);
  y -= 10;

  section(t.recipient);
  row(t.recipient, receipt.recipient.name);
  row(t.method, (t.methods as Record<string, string>)[receipt.deliveryMethod] ?? receipt.deliveryMethod);
  if (receipt.recipient.bankName) row(t.bank, receipt.recipient.bankName);
  if (receipt.recipient.accountMasked) row(t.account, receipt.recipient.accountMasked);
  else row(t.phone, receipt.recipient.phone);
  row(t.country, receipt.destCountryName);
  y -= 10;

  section(t.status);
  row(t.created, dateText(receipt.createdAt, t.locale));
  row(t.paid, dateText(receipt.paidAt, t.locale));
  row(t.delivered, dateText(receipt.deliveredAt, t.locale));
  const inProgress = ["awaiting_payment", "payment_detected", "payout_queued", "payout_sent"].includes(receipt.status);
  if (inProgress) row(t.eta, (t.etas as Record<string, string>)[receipt.deliveryEstimate] ?? receipt.deliveryEstimate);
  row(t.payoutRef, receipt.payoutRef);
  y -= 10;

  // Service client.
  section(t.support);
  const supportBits = [contact.email, company.phone, company.whatsapp ? `WhatsApp ${company.whatsapp}` : null].filter(Boolean).join("  ·  ");
  text(page, supportBits, M, y, 10, regular, INK);
  y -= 18;
  for (const l of wrap(regular, safe(regular, t.keep), 9, W)) {
    text(page, l, M, y, 9, regular, MUTED);
    y -= 12;
  }

  // Pied de page : mention légale (uniquement des informations réelles : rien n'est inventé).
  const legal = [
    company.legalName ?? `PWFINTECH (${appFullName})`,
    [company.address, company.city, company.province, company.country].filter(Boolean).join(", "),
    company.registration ? `CANAFE / FINTRAC : ${company.registration}` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");
  let fy = M + 22;
  page.drawLine({ start: { x: M, y: fy + 14 }, end: { x: M + W, y: fy + 14 }, thickness: 0.75, color: LINE });
  for (const l of wrap(regular, safe(regular, legal), 8, W)) {
    text(page, l, M, fy, 8, regular, MUTED);
    fy -= 11;
  }
  text(page, `${t.generated} ${dateText(new Date().toISOString(), t.locale)}`, M, fy, 8, regular, MUTED);

  return doc.save();
}
