/**
 * Client de l'API PWFINTECH (Next.js, dossier web/).
 * L'URL se règle avec EXPO_PUBLIC_API_URL (ex. https://pwfintech.vercel.app).
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export type Network = { id: string; label: string; type: "mobile_money" | "bank" | "cash" };

export type CorridorMeta = {
  id: string;
  source: string;
  destination: string;
  active: boolean;
  minSend: number;
  maxSend: number;
  deliveryEstimate: string;
  sourceName: string;
  destName: string;
  sendCurrency: string;
  receiveCurrency: string;
  networks: Network[];
};

export type Quote = {
  corridorId: string;
  sourceCountry: string;
  destCountry: string;
  sendCurrency: string;
  receiveCurrency: string;
  sendAmount: number;
  receiveAmount: number;
  rate: number;
  fee: number;
  total: number;
  deliveryEstimate: string;
  expiresAt: string;
};

export type TransferEvent = { id: string; type: string; message: string; createdAt: string };

export type Transfer = {
  id: string;
  reference: string;
  status: string;
  corridorId: string;
  sourceCountry: string;
  destCountry: string;
  sendCurrency: string;
  receiveCurrency: string;
  senderName: string;
  senderEmail: string;
  sendAmountCad: number;
  receiveAmountXaf: number;
  rate: number;
  feeCad: number;
  totalCad: number;
  payInProvider: string;
  createdAt: string;
  beneficiary: {
    fullName: string;
    phone: string;
    network: string;
    country: string;
    bankName?: string | null;
    accountMasked?: string | null;
    bankCode?: string | null;
  };
  events?: TransferEvent[];
};

export type PayInSession = { provider: "stripe" | "mock"; checkoutUrl?: string; sessionId: string };

export type BeneficiaryInput = {
  fullName: string;
  phone?: string;
  network: string;
  bankName?: string;
  accountNumber?: string;
  bankCode?: string;
};

export type ServiceKind = "contact" | "shipping_quote" | "finance_appointment" | "tech_project";

export type Shipment = {
  number: string;
  origin: string;
  destination: string;
  mode: "air" | "sea";
  status: string;
  weightKg: number | null;
  estimatedDelivery: string | null;
  events: { status: string; label: string; location: string | null; at: string }[];
};

export type Address = { line1: string; line2?: string; city: string; region: string; postalCode?: string };

/** Compte client tel que renvoyé par /api/me. */
export type Customer = {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  country: string;
  region?: string | null;
  birthDate?: string | null;
  occupation?: string | null;
  jobTitle?: string | null;
  address?: Address | null;
  marketing?: boolean;
  kyc: "none" | "pending" | "verified" | "rejected";
  kycDocument?: string | null;
  kycNote?: string | null;
  kycVerifiedAt?: string | null;
  mustChangePassword: boolean;
  passwordChangedAt?: string | null;
  createdAt: string;
};

export type SignupInput = Omit<Customer, "id" | "kyc" | "kycDocument" | "kycNote" | "kycVerifiedAt" | "mustChangePassword" | "passwordChangedAt" | "createdAt"> & {
  password: string;
  device?: string;
};

export type DeviceSession = { id: string; device: string | null; createdAt: string; lastUsedAt: string; current: boolean };

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function errorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const err = (data as { error?: unknown }).error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const flat = err as { formErrors?: string[]; fieldErrors?: Record<string, string[] | undefined> };
    const first = flat.formErrors?.[0] ?? Object.values(flat.fieldErrors ?? {}).flat()[0];
    if (first) return first;
  }
  return null;
}

/** Jeton de session du client connecté (ajouté en Authorization: Bearer). */
let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

async function request<T>(path: string, init?: RequestInit & { token?: string | null }): Promise<T> {
  let res: Response;
  const token = init?.token !== undefined ? init.token : authToken;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError("Connexion impossible. Vérifiez votre réseau.", 0);
  }
  const data = await res.json().catch(() => null);
  if (res.status === 401 && token && path.startsWith("/api/me")) onUnauthorized?.();
  if (!res.ok) throw new ApiError(errorMessage(data) ?? "Une erreur est survenue.", res.status);
  return data as T;
}

export const api = {
  signup: (input: SignupInput) => request<{ token: string; customer: Customer }>("/api/auth/signup", { method: "POST", body: JSON.stringify(input) }),
  login: (email: string, password: string, device?: string) =>
    request<{ token: string; customer: Customer }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password, device }) }),
  logout: (token: string) => request<{ ok: true }>("/api/auth/logout", { method: "POST", token }),
  passwordReset: (email: string) => request<{ ok: true }>("/api/auth/password-reset", { method: "POST", body: JSON.stringify({ email }) }),
  me: (token?: string) => request<{ customer: Customer }>("/api/me", token ? { token } : undefined),
  updateMe: (patch: Partial<Customer>) => request<{ customer: Customer }>("/api/me", { method: "PATCH", body: JSON.stringify(patch) }),
  deleteMe: (password: string) => request<{ ok: true }>("/api/me", { method: "DELETE", body: JSON.stringify({ password }) }),
  changePassword: (current: string, next: string, token?: string) =>
    request<{ customer: Customer }>("/api/me/password", { method: "POST", body: JSON.stringify({ current, next }), ...(token ? { token } : {}) }),
  submitKyc: (document: string) => request<{ customer: Customer }>("/api/me/kyc", { method: "POST", body: JSON.stringify({ document }) }),
  myTransfers: () => request<Transfer[]>("/api/me/transfers"),
  sessions: () => request<DeviceSession[]>("/api/me/sessions"),
  revokeSession: (id: string) => request<{ ok: true }>(`/api/me/sessions/${encodeURIComponent(id)}`, { method: "DELETE" }),
  revokeOtherSessions: () => request<{ ok: true; revoked: number }>("/api/me/sessions", { method: "DELETE" }),
  corridors: () => request<CorridorMeta[]>("/api/quotes?meta=corridors"),
  quote: (corridorId: string, amount: number, mode: "send" | "receive" = "send") =>
    request<Quote>("/api/quotes", {
      method: "POST",
      body: JSON.stringify(mode === "send" ? { corridorId, sendAmount: amount } : { corridorId, receiveAmount: amount }),
    }),
  createTransfer: (input: {
    corridorId: string;
    sendAmount: number;
    senderName: string;
    senderEmail: string;
    beneficiary: BeneficiaryInput;
  }) => request<{ transfer: Transfer; payIn: PayInSession }>("/api/transfers", { method: "POST", body: JSON.stringify(input) }),
  transfer: (id: string) => request<Transfer>(`/api/transfers/${encodeURIComponent(id)}`),
  submitRequest: (input: { kind: ServiceKind; name: string; email: string; phone?: string; payload: Record<string, unknown> }) =>
    request<{ ok: true; reference: string }>("/api/requests", { method: "POST", body: JSON.stringify({ ...input, locale: "fr" }) }),
  slots: (date: string) => request<{ date: string; slots: string[]; timezone: string }>(`/api/appointments/slots?date=${date}`),
  trackShipment: (number: string) => request<{ shipment: Shipment }>(`/api/shipments/track?number=${encodeURIComponent(number)}`),
  simulatePay: (id: string) => request<Transfer>(`/api/transfers/${encodeURIComponent(id)}/simulate-pay`, { method: "POST" }),
};
