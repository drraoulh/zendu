import { randomUUID } from "crypto";
import type { PayoutProvider, PayoutResult } from "./payout";

/**
 * MTN MoMo Disbursements — aligned with OpenAPI:
 * docs/momo-disbursement.openapi.json
 *
 * Base: https://sandbox.momodeveloper.mtn.com/disbursement
 * - POST /token/
 * - POST /v1_0/transfer
 * - GET  /v1_0/transfer/{referenceId}
 * - GET  /v1_0/accountholder/{type}/{id}/active
 * - GET  /v1_0/account/balance
 */
type MomoConfig = {
  subscriptionKey: string;
  apiUser: string;
  apiKey: string;
  targetEnv: string;
  currency: string;
  callbackUrl?: string;
  baseUrl: string;
};

function getConfig(): MomoConfig {
  const subscriptionKey = process.env.MTN_SUBSCRIPTION_KEY;
  const apiUser = process.env.MTN_API_USER;
  const apiKey = process.env.MTN_API_KEY;
  if (!subscriptionKey || !apiUser || !apiKey) {
    throw new Error("MTN_SUBSCRIPTION_KEY / MTN_API_USER / MTN_API_KEY manquants");
  }

  const targetEnv = process.env.MTN_TARGET_ENV ?? "sandbox";
  // Sandbox MTN utilise souvent EUR ; production Cameroun = XAF
  const currency =
    process.env.MTN_CURRENCY ?? (targetEnv === "sandbox" ? "EUR" : "XAF");
  const baseUrl =
    process.env.MTN_BASE_URL ??
    (targetEnv === "sandbox"
      ? "https://sandbox.momodeveloper.mtn.com/disbursement"
      : "https://proxy.momoapi.mtn.com/disbursement");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const callbackUrl =
    process.env.MTN_CALLBACK_URL ?? `${appUrl}/api/webhooks/momo`;

  return {
    subscriptionKey,
    apiUser,
    apiKey,
    targetEnv,
    currency,
    callbackUrl,
    baseUrl,
  };
}

function normalizeMsisdn(phone: string): string {
  return phone.replace(/[^\d]/g, "").replace(/^\+/, "");
}

async function createAccessToken(cfg: MomoConfig): Promise<string> {
  const auth = Buffer.from(`${cfg.apiUser}:${cfg.apiKey}`).toString("base64");
  const res = await fetch(`${cfg.baseUrl}/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Ocp-Apim-Subscription-Key": cfg.subscriptionKey,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MoMo token error ${res.status}: ${body}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

function authHeaders(cfg: MomoConfig, token: string, referenceId?: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "X-Target-Environment": cfg.targetEnv,
    "Ocp-Apim-Subscription-Key": cfg.subscriptionKey,
    "Content-Type": "application/json",
  };
  if (referenceId) headers["X-Reference-Id"] = referenceId;
  if (cfg.callbackUrl) headers["X-Callback-Url"] = cfg.callbackUrl;
  return headers;
}

export async function momoValidatePayee(phone: string): Promise<boolean> {
  const cfg = getConfig();
  const token = await createAccessToken(cfg);
  const msisdn = normalizeMsisdn(phone);
  const res = await fetch(
    `${cfg.baseUrl}/v1_0/accountholder/msisdn/${msisdn}/active`,
    {
      method: "GET",
      headers: authHeaders(cfg, token),
    },
  );
  return res.ok;
}

export async function momoGetBalance(): Promise<{
  availableBalance: string;
  currency: string;
} | null> {
  const cfg = getConfig();
  const token = await createAccessToken(cfg);
  const res = await fetch(`${cfg.baseUrl}/v1_0/account/balance`, {
    method: "GET",
    headers: authHeaders(cfg, token),
  });
  if (!res.ok) return null;
  return (await res.json()) as { availableBalance: string; currency: string };
}

export type MomoTransferStatus = {
  status: "PENDING" | "SUCCESSFUL" | "FAILED" | string;
  financialTransactionId?: string;
  reason?: { code?: string; message?: string };
  amount?: string;
  currency?: string;
  externalId?: string;
};

export async function momoGetTransferStatus(
  referenceId: string,
): Promise<MomoTransferStatus> {
  const cfg = getConfig();
  const token = await createAccessToken(cfg);
  const res = await fetch(`${cfg.baseUrl}/v1_0/transfer/${referenceId}`, {
    method: "GET",
    headers: authHeaders(cfg, token),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MoMo status error ${res.status}: ${body}`);
  }
  return (await res.json()) as MomoTransferStatus;
}

export function createMomoPayout(): PayoutProvider {
  return {
    name: "momo",
    async disburse({ reference, amountXaf, phone, fullName }): Promise<PayoutResult> {
      const cfg = getConfig();
      const token = await createAccessToken(cfg);
      const payoutRef = randomUUID();
      const msisdn = normalizeMsisdn(phone);

      // Sandbox EUR: on envoie un montant test symbolique si currency != XAF
      const amount =
        cfg.currency === "XAF"
          ? String(Math.round(amountXaf))
          : String(Math.max(1, Math.round(amountXaf / 650)));

      const res = await fetch(`${cfg.baseUrl}/v1_0/transfer`, {
        method: "POST",
        headers: authHeaders(cfg, token, payoutRef),
        body: JSON.stringify({
          amount,
          currency: cfg.currency,
          externalId: reference.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64),
          payee: {
            partyIdType: "MSISDN",
            partyId: msisdn,
          },
          payerMessage: "Zendu",
          payeeNote: `Zendu ${fullName}`.slice(0, 50),
        }),
      });

      if (res.status !== 202) {
        const body = await res.text();
        return {
          provider: "momo",
          payoutRef,
          status: "failed",
          message: body || `MoMo HTTP ${res.status}`,
        };
      }

      // Poll status a few times (OpenAPI: GET /v1_0/transfer/{referenceId})
      for (let i = 0; i < 5; i += 1) {
        await new Promise((r) => setTimeout(r, 800));
        try {
          const st = await momoGetTransferStatus(payoutRef);
          if (st.status === "SUCCESSFUL") {
            return {
              provider: "momo",
              payoutRef,
              status: "delivered",
              message: `MoMo SUCCESSFUL ${st.financialTransactionId ?? ""}`.trim(),
            };
          }
          if (st.status === "FAILED") {
            return {
              provider: "momo",
              payoutRef,
              status: "failed",
              message:
                st.reason?.message ??
                st.reason?.code ??
                "MoMo transfer FAILED",
            };
          }
        } catch {
          break;
        }
      }

      return {
        provider: "momo",
        payoutRef,
        status: "sent",
        message: "Accepté par MoMo (202) — en attente callback / statut",
      };
    },
  };
}
