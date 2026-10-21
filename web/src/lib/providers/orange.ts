import https from "node:https";
import { randomBytes } from "node:crypto";
import { ORANGE_CA } from "./orange-ca";
import type { PayoutProvider, PayoutResult } from "./payout";

/**
 * Orange Money Cameroun — API OM-API Manager (guide d'intégration v1.0, octobre 2026).
 *
 * - Jeton OAuth2 : POST https://apistore.orange.cm/oauth2/token (Basic clé:secret de l'application)
 * - API : https://apistore-gateway.orange.cm/omcoreapis/1.0.2, en-têtes « wso2-auth: Bearer <jeton> »
 *   et « X-AUTH-TOKEN » (fourni par Orange Money).
 * - Versement vers un portefeuille Orange Money = Cashin : /cashin/init → /cashin/pay → /cashin/paymentstatus.
 *
 * Sandbox et production utilisent les MÊMES URL : ce sont les clés qui choisissent l'environnement.
 * ORANGE_TARGET_ENV dit donc explicitement si les clés en place sont celles du sandbox (aucun argent réel).
 * Aucune valeur secrète n'est écrite ici : tout vient des variables d'environnement.
 */
type OrangeConfig = {
  consumerKey: string;
  consumerSecret: string;
  xAuthToken: string;
  channelMsisdn: string;
  pin: string;
  tokenUrl: string;
  baseUrl: string;
  notifUrl: string;
};

export function orangeConfigured(): boolean {
  return Boolean(
    process.env.ORANGE_CONSUMER_KEY?.trim() &&
      process.env.ORANGE_CONSUMER_SECRET?.trim() &&
      process.env.ORANGE_X_AUTH_TOKEN?.trim() &&
      process.env.ORANGE_CHANNEL_MSISDN?.trim() &&
      process.env.ORANGE_PIN?.trim(),
  );
}

export function orangeIsSandbox(): boolean {
  return (process.env.ORANGE_TARGET_ENV?.trim() || "sandbox") === "sandbox";
}

function getConfig(): OrangeConfig {
  if (!orangeConfigured()) {
    throw new Error("ORANGE_CONSUMER_KEY / ORANGE_CONSUMER_SECRET / ORANGE_X_AUTH_TOKEN / ORANGE_CHANNEL_MSISDN / ORANGE_PIN manquants");
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    consumerKey: process.env.ORANGE_CONSUMER_KEY!.trim(),
    consumerSecret: process.env.ORANGE_CONSUMER_SECRET!.trim(),
    xAuthToken: process.env.ORANGE_X_AUTH_TOKEN!.trim(),
    channelMsisdn: normalizeOrangeMsisdn(process.env.ORANGE_CHANNEL_MSISDN!),
    pin: process.env.ORANGE_PIN!.trim(),
    tokenUrl: process.env.ORANGE_TOKEN_URL?.trim() || "https://apistore.orange.cm/oauth2/token",
    baseUrl: (process.env.ORANGE_BASE_URL?.trim() || "https://apistore-gateway.orange.cm/omcoreapis/1.0.2").replace(/\/$/, ""),
    notifUrl: process.env.ORANGE_NOTIF_URL?.trim() || `${appUrl}/api/webhooks/orange`,
  };
}

/** Numéro au format Orange : 9 chiffres, sans indicatif (237). */
export function normalizeOrangeMsisdn(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("237") ? digits.slice(3) : digits;
}

type HttpResult = { status: number; text: string; json: unknown };

function request(method: "GET" | "POST", url: string, headers: Record<string, string>, body?: string): Promise<HttpResult> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method, headers, ca: ORANGE_CA, timeout: 60_000 }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let json: unknown = null;
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }
        resolve({ status: res.statusCode ?? 0, text, json });
      });
    });
    req.on("timeout", () => req.destroy(new Error(`Orange Money : délai dépassé (${method} ${url})`)));
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

// Jeton réutilisé jusqu'à 60 s avant son expiration (règle de sécurité 6.1 du guide).
let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(cfg: OrangeConfig, force = false): Promise<string> {
  if (!force && cachedToken && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.value;
  const basic = Buffer.from(`${cfg.consumerKey}:${cfg.consumerSecret}`).toString("base64");
  const res = await request(
    "POST",
    cfg.tokenUrl,
    { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    "grant_type=client_credentials",
  );
  const data = res.json as { access_token?: string; expires_in?: number } | null;
  if (res.status !== 200 || !data?.access_token) {
    throw new Error(`Orange Money : jeton refusé (HTTP ${res.status})`);
  }
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return cachedToken.value;
}

/** Appel à l'API ; un 401 (jeton expiré) déclenche un seul nouvel essai avec un jeton neuf. */
async function call(method: "GET" | "POST", path: string, payload?: Record<string, unknown>): Promise<HttpResult> {
  const cfg = getConfig();
  const body = payload ? JSON.stringify(payload) : undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const token = await accessToken(cfg, attempt > 0);
    const res = await request(
      method,
      `${cfg.baseUrl}${path}`,
      { "wso2-auth": `Bearer ${token}`, "X-AUTH-TOKEN": cfg.xAuthToken, "Content-Type": "application/json" },
      body,
    );
    if (res.status !== 401) return res;
  }
  throw new Error(`Orange Money : accès refusé (HTTP 401) sur ${path}`);
}

export type OrangeTxn = {
  payToken?: string;
  status?: "PENDING" | "SUCCESSFULL" | "FAILED" | "CANCELLED" | "EXPIRED" | string;
  txnid?: string;
  orderId?: string;
  amount?: number;
  txnmessage?: string | null;
  confirmtxnmessage?: string | null;
  confirmtxnstatus?: string | null;
};

function dataOf(res: HttpResult): OrangeTxn & { message?: string } {
  const j = (res.json ?? {}) as { message?: string; data?: OrangeTxn };
  return { ...(j.data ?? {}), message: j.message };
}

/** Statut d'un Cashin (versement vers un portefeuille). Fait foi avant toute mise à jour d'un transfert. */
export async function orangeCashinStatus(payToken: string): Promise<OrangeTxn> {
  const res = await call("GET", `/cashin/paymentstatus/${encodeURIComponent(payToken)}`);
  if (res.status !== 200) throw new Error(`Orange Money statut : HTTP ${res.status}`);
  return dataOf(res);
}

/** Libellé lisible d'un statut Orange final en échec. */
export function orangeFailureReason(t: OrangeTxn): string {
  return t.txnmessage && t.txnmessage !== "null" ? t.txnmessage : t.confirmtxnmessage || `Orange Money ${t.status ?? "FAILED"}`;
}

export const ORANGE_FAILED = new Set(["FAILED", "CANCELLED", "EXPIRED"]);

export function createOrangePayout(): PayoutProvider {
  return {
    name: "orange",
    async disburse({ reference, amountXaf, phone, fullName }): Promise<PayoutResult> {
      const cfg = getConfig();
      // 1. Un payToken neuf pour chaque opération (jamais réutilisé).
      const init = await call("POST", "/cashin/init");
      const payToken = dataOf(init).payToken;
      if (init.status !== 200 || !payToken) {
        return { provider: "orange", payoutRef: "", status: "failed", message: `Orange Money init : HTTP ${init.status}` };
      }
      // orderId unique : la référence du transfert + un suffixe (un nouvel essai ne réutilise jamais l'ancien).
      const orderId = `${reference.replace(/[^A-Za-z0-9-]/g, "")}-${randomBytes(3).toString("hex")}`;
      const pay = await call("POST", "/cashin/pay", {
        channelUserMsisdn: cfg.channelMsisdn,
        amount: Math.round(amountXaf),
        subscriberMsisdn: normalizeOrangeMsisdn(phone),
        pin: cfg.pin,
        orderId,
        description: `WorldSoft Transfer ${reference} ${fullName}`.slice(0, 100),
        payToken,
        notifUrl: cfg.notifUrl,
      });
      const d = dataOf(pay);
      if (pay.status !== 200) {
        // Délai dépassé ou 5xx : le versement a pu passer, on vérifie le statut avant de conclure.
        if (pay.status >= 500) {
          return { provider: "orange", payoutRef: payToken, status: "sent", message: `Orange Money HTTP ${pay.status}, statut à vérifier` };
        }
        return { provider: "orange", payoutRef: payToken, status: "failed", message: d.message || `Orange Money pay : HTTP ${pay.status}` };
      }
      if (d.status === "SUCCESSFULL") {
        return { provider: "orange", payoutRef: payToken, status: "delivered", message: `Orange Money SUCCESSFULL ${d.txnid ?? ""}`.trim() };
      }
      if (d.status && ORANGE_FAILED.has(d.status)) {
        return { provider: "orange", payoutRef: payToken, status: "failed", message: orangeFailureReason(d) };
      }
      return { provider: "orange", payoutRef: payToken, status: "sent", message: "Accepté par Orange Money, en attente de confirmation" };
    },
  };
}
