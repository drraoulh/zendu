import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";

/**
 * Courriels envoyés au client quand son transfert avance (Brevo, mêmes variables que les codes de
 * connexion : BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME). Sans Brevo : rien n'est envoyé.
 * Un échec d'envoi n'empêche jamais le transfert d'avancer (seulement journalisé, sans donnée perso).
 */
export type NotifyKind = "payment_detected" | "delivered" | "payout_failed" | "payment_mismatch" | "expired";

export const NOTIFY_KINDS: readonly string[] = ["payment_detected", "delivered", "payout_failed", "payment_mismatch", "expired"];

const esc = (s: string) => s.replace(/[<>&"]/g, "");

function content(kind: NotifyKind, t: { reference: string; receiveAmountXaf: number; receiveCurrency: string; totalCad: number; sendCurrency: string; failureReason: string | null }, who: string) {
  const received = formatMoney(t.receiveAmountXaf, t.receiveCurrency, "fr-CA");
  const paid = formatMoney(t.totalCad, t.sendCurrency, "fr-CA");
  switch (kind) {
    case "payment_detected":
      return { subject: `Paiement reçu — transfert ${t.reference}`, text: `Nous avons bien reçu votre paiement de ${paid}. L'envoi de ${received} à ${who} est en cours.` };
    case "delivered":
      return { subject: `Argent livré — transfert ${t.reference}`, text: `Bonne nouvelle : ${who} a reçu ${received}.` };
    case "payout_failed":
      return { subject: `Problème de versement — transfert ${t.reference}`, text: `Le versement à ${who} n'a pas abouti${t.failureReason ? ` (${t.failureReason})` : ""}. Notre équipe vous contacte pour le relancer ou vous rembourser.` };
    case "payment_mismatch":
      return { subject: `Paiement à vérifier — transfert ${t.reference}`, text: `Le paiement reçu ne correspond pas au transfert (montant ou message). Notre équipe vous contacte.` };
    case "expired":
      return { subject: `Transfert expiré — ${t.reference}`, text: `Nous n'avons pas reçu votre paiement dans le délai prévu : le transfert a été annulé. Si vous avez déjà payé, contactez-nous avec la référence ${t.reference}.` };
  }
}

export async function notifyCustomer(transferId: string, kind: NotifyKind): Promise<void> {
  const key = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  if (!key || !senderEmail) return;
  try {
    const t = await prisma.transfer.findUnique({ where: { id: transferId }, include: { beneficiary: true } });
    if (!t?.senderEmail) return;
    const who = t.beneficiary.fullName.split(" ")[0] || t.beneficiary.fullName;
    const c = content(kind, t, who);
    const name = t.senderName.split(" ")[0] || t.senderName;
    const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f5f8ff;font-family:Arial,Helvetica,sans-serif;color:#0a1838">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px">
<tr><td style="font-size:20px;font-weight:bold;color:#061a52">WorldSoft <span style="color:#0b4dff">Transfer</span></td></tr>
<tr><td style="padding-top:24px;font-size:16px">Bonjour ${esc(name)},</td></tr>
<tr><td style="padding-top:8px;font-size:15px;color:#4a5878;line-height:1.5">${esc(c.text)}</td></tr>
<tr><td style="padding-top:16px;font-size:13px;color:#8090ad">Référence : ${esc(t.reference)} — suivez votre transfert dans l'application.</td></tr>
</table></td></tr></table></body></html>`;
    const base = (process.env.BREVO_API_URL?.trim() || "https://api.brevo.com/v3").replace(/\/$/, "");
    const res = await fetch(`${base}/smtp/email`, {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { email: senderEmail, name: process.env.BREVO_SENDER_NAME?.trim() || "WorldSoft Transfer" },
        to: [{ email: t.senderEmail, name: t.senderName }],
        subject: c.subject,
        htmlContent: html,
        textContent: `Bonjour ${name},\n\n${c.text}\n\nRéférence : ${t.reference}`,
        tags: [`transfer-${kind}`],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("[notify] Brevo a refusé l'envoi", kind, res.status);
  } catch (error) {
    console.error("[notify] envoi impossible", kind, error instanceof Error ? error.message : "erreur");
  }
}
