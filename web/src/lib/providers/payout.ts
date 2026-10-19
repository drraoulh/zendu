import { isLiveMode } from "@/lib/mode";
import { isBankNetwork, MANUAL_BANK_PROVIDER, MANUAL_PAYOUT_PROVIDER, MOCK_BANK_PROVIDER } from "@/lib/bank";

export type PayoutRequest = {
  transferId: string;
  reference: string;
  amountXaf: number;
  phone: string;
  fullName: string;
  /** Virement bancaire uniquement. */
  bank?: { bankName: string; accountNumber: string; bankCode?: string | null };
};

export type PayoutResult = {
  provider: "momo" | "mock_momo" | "mock_bank";
  payoutRef: string;
  status: "sent" | "delivered" | "failed";
  message?: string;
};

export type PayoutProvider = {
  name: "momo" | "mock_momo" | "mock_bank";
  disburse: (input: PayoutRequest) => Promise<PayoutResult>;
};

export function getPayoutMode(): "momo" | "mock_momo" {
  return process.env.MTN_SUBSCRIPTION_KEY &&
    process.env.MTN_API_USER &&
    process.env.MTN_API_KEY
    ? "momo"
    : "mock_momo";
}

/**
 * Qui verse l'argent à ce bénéficiaire ?
 * - Démo, sans clé MTN : tout est simulé (mock_momo pour les portefeuilles, mock_bank pour les banques).
 * - L'API MTN MoMo ne sert QUE pour MTN au Cameroun, et en mode réel seulement avec des clés de
 *   production (MTN_TARGET_ENV ≠ "sandbox") : le bac à sable ne verse pas de vrai argent.
 * - Tout le reste (Orange Money, Alipay, WeChat Pay, Interac, banques, ou MTN sans clés de production
 *   en mode réel) passe en versement manuel par l'équipe, jamais en simulation : un transfert réel ne
 *   doit pas être marqué « livré » sans qu'un versement ait eu lieu.
 */
export function momoLiveReady(): boolean {
  return getPayoutMode() === "momo" && !momoIsSandbox();
}

export function momoIsSandbox(): boolean {
  return (process.env.MTN_TARGET_ENV?.trim() || "sandbox") === "sandbox";
}

/**
 * Tests en mode réel avec la sandbox MTN : seuls les comptes listés dans MTN_SANDBOX_TESTERS
 * (courriels séparés par des virgules) passent par MoMo sandbox, qui ne verse AUCUN argent réel.
 * Tous les autres clients restent en versement manuel : un vrai client ne doit jamais voir
 * « Livré » pour un versement fictif.
 */
export function isSandboxTester(senderEmail?: string | null): boolean {
  if (!senderEmail) return false;
  const list = (process.env.MTN_SANDBOX_TESTERS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(senderEmail.trim().toLowerCase());
}

export function payoutProviderFor(network: string, country: string, senderEmail?: string | null): string {
  const bank = isBankNetwork(network, country);
  const live = isLiveMode();
  if (!live && getPayoutMode() !== "momo") return bank ? MOCK_BANK_PROVIDER : "mock_momo";
  const momoUsable = live
    ? momoLiveReady() || (getPayoutMode() === "momo" && momoIsSandbox() && isSandboxTester(senderEmail))
    : getPayoutMode() === "momo";
  if (momoUsable && network === "MTN" && country === "CM") return "momo";
  return bank ? MANUAL_BANK_PROVIDER : MANUAL_PAYOUT_PROVIDER;
}
