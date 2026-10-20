import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";

/**
 * Notifications push de l'appli WorldSoft Transfer, envoyées par le service push d'Expo
 * (https://docs.expo.dev/push-notifications/sending-notifications/). Jetons « ExponentPushToken[…] »
 * enregistrés par l'appli (POST /api/me/push-token). EXPO_ACCESS_TOKEN est facultatif (sécurité
 * renforcée des envois si activée dans le compte Expo). Un échec n'empêche jamais le transfert d'avancer.
 */
export type PushLang = "fr" | "en" | "es" | "zh";

export function pushLang(raw: unknown): PushLang {
  return raw === "en" || raw === "es" || raw === "zh" ? raw : "fr";
}

export function isExpoPushToken(token: string): boolean {
  return /^(ExponentPushToken|ExpoPushToken)\[[\w-]+\]$/.test(token);
}

type PushMessage = { title: string; body: string; data?: Record<string, string> };

const LOCALES: Record<PushLang, string> = { fr: "fr-CA", en: "en-CA", es: "es", zh: "zh-CN" };

export type TransferPushKind = "payment_detected" | "delivered" | "payout_failed" | "payment_mismatch" | "expired" | "cancelled";

type TransferFacts = { reference: string; who: string; received: number; receiveCurrency: string; sandbox: boolean };

function transferText(kind: TransferPushKind, lang: PushLang, f: TransferFacts): PushMessage {
  const amount = formatMoney(f.received, f.receiveCurrency, LOCALES[lang]);
  const T: Record<PushLang, Record<TransferPushKind, [string, string]>> = {
    fr: {
      payment_detected: ["Paiement reçu", `Nous avons reçu votre paiement. L'envoi de ${amount} à ${f.who} est en cours.`],
      delivered: f.sandbox
        ? ["Versement de TEST", `Test : versement simulé de ${amount} à ${f.who}. Aucun argent réel n'a été versé.`]
        : [`${f.who} a reçu ${amount}`, `Votre transfert ${f.reference} est livré.`],
      payout_failed: ["Versement à vérifier", `Le versement à ${f.who} n'a pas abouti. Notre équipe s'en occupe.`],
      payment_mismatch: ["Paiement à vérifier", `Le paiement reçu ne correspond pas au transfert ${f.reference}. Notre équipe vous contacte.`],
      expired: ["Transfert expiré", `Paiement non reçu à temps : le transfert ${f.reference} est annulé.`],
      cancelled: ["Transfert annulé", `Le transfert ${f.reference} a été annulé. Si vous l'aviez payé, vous êtes remboursé par Interac.`],
    },
    en: {
      payment_detected: ["Payment received", `We received your payment. ${amount} is on its way to ${f.who}.`],
      delivered: f.sandbox
        ? ["TEST payout", `Test: simulated payout of ${amount} to ${f.who}. No real money was sent.`]
        : [`${f.who} received ${amount}`, `Your transfer ${f.reference} has been delivered.`],
      payout_failed: ["Payout needs attention", `The payout to ${f.who} did not go through. Our team is on it.`],
      payment_mismatch: ["Payment to review", `The payment received doesn't match transfer ${f.reference}. Our team will contact you.`],
      expired: ["Transfer expired", `Payment not received in time: transfer ${f.reference} was cancelled.`],
      cancelled: ["Transfer cancelled", `Transfer ${f.reference} was cancelled. If you paid, you're refunded by Interac.`],
    },
    es: {
      payment_detected: ["Pago recibido", `Recibimos su pago. El envío de ${amount} a ${f.who} está en curso.`],
      delivered: f.sandbox
        ? ["Pago de PRUEBA", `Prueba: pago simulado de ${amount} a ${f.who}. No se envió dinero real.`]
        : [`${f.who} recibió ${amount}`, `Su envío ${f.reference} fue entregado.`],
      payout_failed: ["Pago por revisar", `El pago a ${f.who} no se completó. Nuestro equipo se encarga.`],
      payment_mismatch: ["Pago por verificar", `El pago recibido no corresponde al envío ${f.reference}. Nuestro equipo le contactará.`],
      expired: ["Envío caducado", `Pago no recibido a tiempo: el envío ${f.reference} fue cancelado.`],
      cancelled: ["Envío cancelado", `El envío ${f.reference} fue cancelado. Si ya pagó, se le reembolsa por Interac.`],
    },
    zh: {
      payment_detected: ["已收到付款", `我们已收到您的付款，${amount} 正在发送给 ${f.who}。`],
      delivered: f.sandbox
        ? ["测试付款", `测试：已模拟向 ${f.who} 付款 ${amount}，未发送真实资金。`]
        : [`${f.who} 已收到 ${amount}`, `您的汇款 ${f.reference} 已送达。`],
      payout_failed: ["付款需处理", `向 ${f.who} 的付款未成功，我们的团队正在处理。`],
      payment_mismatch: ["付款需核实", `收到的付款与汇款 ${f.reference} 不符，我们的团队会联系您。`],
      expired: ["汇款已过期", `未按时收到付款：汇款 ${f.reference} 已取消。`],
      cancelled: ["汇款已取消", `汇款 ${f.reference} 已取消。如已付款，将通过 Interac 退款。`],
    },
  };
  const [title, body] = T[lang][kind];
  return { title, body };
}

type KycKind = "verified" | "rejected";
const KYC: Record<PushLang, Record<KycKind, [string, string]>> = {
  fr: { verified: ["Identité vérifiée", "Vous pouvez maintenant envoyer de l'argent."], rejected: ["Vérification à reprendre", "Ouvrez l'appli pour recommencer la vérification d'identité."] },
  en: { verified: ["Identity verified", "You can now send money."], rejected: ["Verification needs a retry", "Open the app to redo your identity check."] },
  es: { verified: ["Identidad verificada", "Ya puede enviar dinero."], rejected: ["Verificación por repetir", "Abra la app para repetir la verificación de identidad."] },
  zh: { verified: ["身份已验证", "您现在可以汇款了。"], rejected: ["需要重新验证", "请打开应用重新进行身份验证。"] },
};

/** Envoie un message (déjà traduit par appareil) à tous les appareils actifs du client. */
async function sendToCustomer(customerId: string, build: (lang: PushLang) => PushMessage): Promise<void> {
  const tokens = await prisma.pushToken.findMany({ where: { customerId, disabledAt: null }, take: 10 });
  if (!tokens.length) return;
  const messages = tokens.map((t) => {
    const m = build(pushLang(t.lang));
    return { to: t.token, title: m.title, body: m.body, data: m.data ?? {}, sound: "default", priority: "high", channelId: "transfers" };
  });
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  const access = process.env.EXPO_ACCESS_TOKEN?.trim();
  if (access) headers.Authorization = `Bearer ${access}`;
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers,
    body: JSON.stringify(messages),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    console.error("[push] envoi refusé", res.status);
    return;
  }
  const out = (await res.json().catch(() => null)) as { data?: Array<{ status: string; details?: { error?: string } }> } | null;
  // Appareil désinscrit (appli supprimée, jeton périmé) : on cesse de lui écrire.
  const gone = (out?.data ?? []).flatMap((r, i) => (r.status === "error" && r.details?.error === "DeviceNotRegistered" ? [tokens[i].token] : []));
  if (gone.length) await prisma.pushToken.updateMany({ where: { token: { in: gone } }, data: { disabledAt: new Date() } });
}

export async function pushTransfer(
  t: { id: string; customerId: string | null; reference: string; receiveAmountXaf: number; receiveCurrency: string; beneficiary: { fullName: string } },
  kind: TransferPushKind,
  sandbox: boolean,
): Promise<void> {
  if (!t.customerId) return;
  try {
    const who = t.beneficiary.fullName.split(" ")[0] || t.beneficiary.fullName;
    await sendToCustomer(t.customerId, (lang) => ({
      ...transferText(kind, lang, { reference: t.reference, who, received: t.receiveAmountXaf, receiveCurrency: t.receiveCurrency, sandbox }),
      data: { transferId: t.id, kind },
    }));
  } catch (error) {
    console.error("[push] notification de transfert impossible", error instanceof Error ? error.message : "erreur");
  }
}

export async function pushKyc(customerId: string, kind: KycKind): Promise<void> {
  try {
    await sendToCustomer(customerId, (lang) => ({ title: KYC[lang][kind][0], body: KYC[lang][kind][1], data: { kind: `kyc_${kind}` } }));
  } catch (error) {
    console.error("[push] notification d'identité impossible", error instanceof Error ? error.message : "erreur");
  }
}
