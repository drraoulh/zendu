/**
 * Client des demandes de service (contrat partagé `POST /api/requests`).
 * Aucune dépendance React : utilisable par n'importe quel parcours.
 */

export type RequestKind = "contact" | "shipping_quote" | "finance_appointment" | "tech_project";

export type RequestBody = {
  kind: RequestKind;
  name: string;
  email: string;
  phone?: string;
  locale?: string;
  /** Pot de miel anti-robots : doit rester vide. */
  website?: string;
  payload: Record<string, unknown>;
};

export type Issue = { path: string[]; message?: string };

export type SubmitResult =
  | { ok: true; reference: string }
  | { ok: false; reason: "invalid"; issues: Issue[] }
  | { ok: false; reason: "unavailable" }
  /** 409 : créneau de rendez-vous déjà réservé entre-temps. */
  | { ok: false; reason: "conflict" }
  /** 429 : trop de demandes depuis cette connexion. */
  | { ok: false; reason: "rate_limited" }
  | { ok: false; reason: "error" };

/** Normalise les formats d'erreurs de validation courants (tableau zod, `flatten()`, objet simple). */
export function normalizeIssues(raw: unknown): Issue[] {
  if (Array.isArray(raw)) {
    return raw.flatMap((item): Issue[] => {
      if (item && typeof item === "object" && "path" in item) {
        const rawPath = (item as { path: unknown }).path;
        const path = Array.isArray(rawPath)
          ? rawPath.map(String)
          : typeof rawPath === "string"
            ? rawPath.split(".")
            : [];
        const message = (item as { message?: unknown }).message;
        return [{ path, message: typeof message === "string" ? message : undefined }];
      }
      if (typeof item === "string") return [{ path: item.split(".") }];
      return [];
    });
  }
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const fieldErrors = (obj.fieldErrors ?? obj) as Record<string, unknown>;
    if (fieldErrors && typeof fieldErrors === "object") {
      return Object.keys(fieldErrors)
        .filter((k) => k !== "formErrors")
        .map((k) => {
          const v = fieldErrors[k];
          const message = Array.isArray(v) ? v.find((x) => typeof x === "string") : typeof v === "string" ? v : undefined;
          return { path: k.split("."), message };
        });
    }
  }
  return [];
}

export async function submitRequest(body: RequestBody): Promise<SubmitResult> {
  let res: Response;
  try {
    res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, reason: "error" };
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* corps absent ou non JSON */
  }
  const json = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;

  if (res.ok && typeof json.reference === "string" && json.reference) {
    return { ok: true, reference: json.reference };
  }
  if (res.status === 400) return { ok: false, reason: "invalid", issues: normalizeIssues(json.issues) };
  if (res.status === 409 || json.code === "slot_taken") return { ok: false, reason: "conflict" };
  if (res.status === 429 || json.code === "rate_limited") return { ok: false, reason: "rate_limited" };
  if (res.status === 503 || json.code === "requests_unavailable") return { ok: false, reason: "unavailable" };
  return { ok: false, reason: "error" };
}

/* -------------------------------------------------------------------------- */
/* Stockage de session (toujours protégé : navigation privée, stockage bloqué) */
/* -------------------------------------------------------------------------- */

export function readSession<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeSession(key: string, value: unknown) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage indisponible : on continue sans brouillon */
  }
}

export function removeSession(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Dernière demande envoyée dans cet onglet : permet à /merci de pré-remplir la vérification de statut. */
export const LAST_REQUEST_KEY = "pwf:last-request";
export type LastRequest = { reference: string; kind: RequestKind; email: string };

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^[+()\d\s.-]{7,20}$/;
