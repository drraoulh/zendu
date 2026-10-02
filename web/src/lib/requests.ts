import { z } from "zod";
import { isLocale } from "@/lib/i18n";

/**
 * Demandes de service du site (contrat partagé — POST /api/requests).
 * Corps : { kind, name, email, phone?, locale?, website? (honeypot), payload }.
 * Réponses : 201 { ok, reference } · 400 { ok:false, error, issues } · 409 { ok:false, code:"slot_taken" }
 * · 429 { ok:false, code:"rate_limited" } · 503 { ok:false, code:"requests_unavailable" }.
 */

export const REQUEST_KINDS = ["contact", "shipping_quote", "finance_appointment", "tech_project"] as const;
export type RequestKind = (typeof REQUEST_KINDS)[number];

export const REQUEST_STATUSES = ["new", "in_progress", "answered", "closed"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const CONTACT_SUBJECTS = ["transfert", "finances", "technologies", "shipping", "autre"] as const;
export const SHIPPING_MODES = ["air", "sea"] as const;
export const APPOINTMENT_MODES = ["video", "phone", "in_person"] as const;

export const REFERENCE_PREFIX: Record<RequestKind, string> = {
  contact: "CT",
  shipping_quote: "SHQ",
  finance_appointment: "FIN",
  tech_project: "TECH",
};

export function isRequestKind(v: unknown): v is RequestKind {
  return typeof v === "string" && (REQUEST_KINDS as readonly string[]).includes(v);
}

export function isRequestStatus(v: unknown): v is RequestStatus {
  return typeof v === "string" && (REQUEST_STATUSES as readonly string[]).includes(v);
}

/* ------------------------------------------------------------------ Références */

/** Alphabet sans caractères ambigus (pas de 0/O, 1/I/L). */
const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomChars(length: number, alphabet: string): string {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let out = "";
  // 31 caractères : le biais du modulo sur 256 est négligeable pour une référence non secrète.
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

/** "CT-7K3QZP", "SHQ-…", "FIN-…", "TECH-…". */
export function generateReference(kind: RequestKind): string {
  return `${REFERENCE_PREFIX[kind]}-${randomChars(6, REF_ALPHABET)}`;
}

const REFERENCE_RE = /^(CT|SHQ|FIN|TECH)-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;

/** Majuscules, sans espaces ; "ct 7k3qzp" → "CT-7K3QZP". Renvoie null si le format est invalide. */
export function normalizeReference(input: string | null | undefined): string | null {
  if (!input) return null;
  let v = input.toUpperCase().replace(/\s+/g, "");
  const m = /^(CT|SHQ|FIN|TECH)-?([A-Z0-9]{6})$/.exec(v);
  if (!m) return null;
  v = `${m[1]}-${m[2]}`;
  return REFERENCE_RE.test(v) ? v : null;
}

export function kindFromReference(reference: string): RequestKind | null {
  const prefix = reference.split("-")[0];
  const entry = Object.entries(REFERENCE_PREFIX).find(([, p]) => p === prefix);
  return entry ? (entry[0] as RequestKind) : null;
}

/* ------------------------------------------------------------------ Schémas zod */

const blankToUndefined = (v: unknown) =>
  v === null || (typeof v === "string" && v.trim() === "") ? undefined : v;

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const optionalText = (max: number) => z.preprocess(blankToUndefined, z.string().trim().max(max).optional());
const optionalNumber = (max: number) =>
  z.preprocess(blankToUndefined, z.coerce.number().finite().min(0).max(max).optional());

export const contactPayloadSchema = z.object({
  subject: z.enum(CONTACT_SUBJECTS),
  message: text(5, 5000),
});

export const shippingQuotePayloadSchema = z.object({
  origin: text(2, 120),
  destination: text(2, 120),
  mode: z.enum(SHIPPING_MODES),
  weightKg: z.coerce.number().finite().positive().max(100000),
  /** Texte libre ("40 x 30 x 20") ou { length, width, height } en cm. */
  dimensionsCm: z.preprocess(
    blankToUndefined,
    z
      .union([
        z.string().trim().max(80),
        z.object({
          length: z.coerce.number().finite().positive().max(10000),
          width: z.coerce.number().finite().positive().max(10000),
          height: z.coerce.number().finite().positive().max(10000),
        }),
      ])
      .optional(),
  ),
  content: text(2, 1000),
  declaredValue: optionalNumber(10_000_000),
  pickup: z.boolean(),
  deliveryAddress: optionalText(400),
});

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const financeAppointmentPayloadSchema = z.object({
  topic: text(2, 200),
  mode: z.enum(APPOINTMENT_MODES),
  date: z.string().regex(DATE_RE, "YYYY-MM-DD"),
  time: z.string().regex(TIME_RE, "HH:mm"),
  timezone: text(1, 64),
  note: optionalText(2000),
});

export const techProjectPayloadSchema = z.object({
  projectTypes: z.array(text(1, 60)).min(1).max(12),
  description: text(10, 5000),
  budget: text(1, 80),
  timeline: text(1, 80),
  company: optionalText(160),
  website: optionalText(200),
});

export const PAYLOAD_SCHEMAS = {
  contact: contactPayloadSchema,
  shipping_quote: shippingQuotePayloadSchema,
  finance_appointment: financeAppointmentPayloadSchema,
  tech_project: techProjectPayloadSchema,
} as const;

export type ContactPayload = z.infer<typeof contactPayloadSchema>;
export type ShippingQuotePayload = z.infer<typeof shippingQuotePayloadSchema>;
export type FinanceAppointmentPayload = z.infer<typeof financeAppointmentPayloadSchema>;
export type TechProjectPayload = z.infer<typeof techProjectPayloadSchema>;

const baseFields = {
  name: text(2, 120),
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  phone: optionalText(40),
  locale: z.preprocess((v) => (isLocale(v) ? v : undefined), z.string().optional()),
  /** Champ piège (honeypot) : invisible pour les humains. */
  website: z.unknown().optional(),
};

export const requestBodySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("contact"), ...baseFields, payload: contactPayloadSchema }),
  z.object({ kind: z.literal("shipping_quote"), ...baseFields, payload: shippingQuotePayloadSchema }),
  z.object({ kind: z.literal("finance_appointment"), ...baseFields, payload: financeAppointmentPayloadSchema }),
  z.object({ kind: z.literal("tech_project"), ...baseFields, payload: techProjectPayloadSchema }),
]);

export type RequestBody = z.infer<typeof requestBodySchema>;

export type Issue = { path: string; message: string };

export function zodIssues(error: z.ZodError): Issue[] {
  return error.issues.map((i) => ({ path: i.path.map(String).join("."), message: i.message }));
}

/** Créneau unique d'un rendez-vous : "YYYY-MM-DDTHH:mm" (heure de l'Est). */
export function appointmentSlotKey(date: string, time: string): string {
  return `${date}T${time}`;
}

/* ------------------------------------------------------------------ Colis Shipping */

export const SHIPMENT_STATUSES = [
  "received",
  "in_transit",
  "customs",
  "out_for_delivery",
  "delivered",
  "exception",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export function isShipmentStatus(v: unknown): v is ShipmentStatus {
  return typeof v === "string" && (SHIPMENT_STATUSES as readonly string[]).includes(v);
}

/** "PWS-04821" (5 chiffres). */
export function generateShipmentNumber(): string {
  return `PWS-${randomChars(5, "0123456789")}`;
}

/** " pws 04821 ", "PWS04821" ou "04821" → "PWS-04821" ; null si invalide. */
export function normalizeShipmentNumber(input: string | null | undefined): string | null {
  if (!input) return null;
  const v = input.toUpperCase().replace(/\s+/g, "");
  const m = /^(?:PWS-?)?(\d{5})$/.exec(v);
  return m ? `PWS-${m[1]}` : null;
}

/* ------------------------------------------------------------------ Divers serveur */

type PrismaLikeError = { name?: unknown; code?: unknown; message?: unknown; meta?: unknown };

/**
 * Table absente ou base injoignable → 503, sans faire planter le reste du site.
 * Détection par nom/code (sans importer @prisma/client : ce fichier est aussi utilisable côté client).
 */
export function isDbUnavailable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as PrismaLikeError;
  const name = typeof e.name === "string" ? e.name : "";
  const code = typeof e.code === "string" ? e.code : "";
  const message = typeof e.message === "string" ? e.message : "";
  if (name === "PrismaClientInitializationError" || name === "PrismaClientRustPanicError") return true;
  if (name === "PrismaClientKnownRequestError") {
    return code === "P2021" || code === "P2022" || code.startsWith("P1");
  }
  if (name === "PrismaClientUnknownRequestError") {
    return /relation .* does not exist|connect|timeout/i.test(message);
  }
  return false;
}

/** Violation d'unicité Prisma (P2002), éventuellement sur un champ précis. */
export function isUniqueViolation(error: unknown, field?: string): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as PrismaLikeError;
  if (e.code !== "P2002") return false;
  if (!field) return true;
  const target = (e.meta as { target?: unknown } | undefined)?.target;
  if (Array.isArray(target)) return target.includes(field);
  if (typeof target === "string") return target.includes(field);
  return false;
}

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Limite anti-spam en mémoire (par instance serveur) : `limit` appels par fenêtre glissante simple.
 * Renvoie true si l'appel est autorisé.
 */
export function rateLimit(key: string, limit: number, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Courriel normalisé (minuscules, sans espaces) ou null s'il est invalide. */
export function safeEmail(input: string | null | undefined): string | null {
  const parsed = z.string().trim().toLowerCase().pipe(z.email().max(254)).safeParse(input ?? "");
  return parsed.success ? parsed.data : null;
}
