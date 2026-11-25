import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { getCountry } from "@/lib/corridors";
import { pushToStaff } from "@/lib/push";
import { MANUAL_PAYIN_PROVIDER } from "@/lib/providers/manual-payin";

/**
 * Alerte de l'équipe quand une commande arrive.
 * - courriel (Brevo) aux adresses de TEAM_ALERT_EMAILS (séparées par des virgules) ;
 * - notification push sur les appareils des comptes clients listés dans TEAM_PUSH_EMAILS (courriels des comptes de
 *   l'équipe dans l'appli) : seulement si l'appli est installée sur ce téléphone et que les notifications marchent.
 * Un échec n'empêche jamais le transfert d'avancer, et rien n'est envoyé si ces variables sont absentes.
 */
export type TeamAlertKind = "new_order" | "payment_declared";

function list(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function alertTeam(transferId: string, kind: TeamAlertKind): Promise<void> {
  try {
    const t = await prisma.transfer.findUnique({ where: { id: transferId }, include: { beneficiary: true } });
    if (!t) return;
    const from = getCountry(t.sourceCountry).name;
    const to = getCountry(t.destCountry).name;
    const paid = formatMoney(t.totalCad, t.sendCurrency, "fr-CA");
    const received = formatMoney(t.receiveAmountXaf, t.receiveCurrency, "fr-CA");
    const method = t.payInProvider === MANUAL_PAYIN_PROVIDER ? "paiement manuel" : t.payInProvider.startsWith("interac") ? "virement Interac" : "carte";
    const subject =
      kind === "new_order"
        ? `Nouvelle commande ${t.reference} : ${paid} (${from} → ${to})`
        : `Paiement signalé ${t.reference} : ${paid} — à vérifier`;
    const line =
      kind === "new_order"
        ? `${t.senderName} a créé un transfert de ${paid} vers ${t.beneficiary.fullName} (${received}), en attente de paiement (${method}).`
        : `${t.senderName} indique avoir envoyé ${paid} (${method}) pour ${t.reference}. Vérifiez la réception puis confirmez dans l'admin.`;

    // Push (appareils de l'équipe)
    await pushToStaff(list("TEAM_PUSH_EMAILS"), {
      title: kind === "new_order" ? "Nouvelle commande" : "Paiement signalé",
      body: `${t.reference} · ${paid} · ${t.senderName.split(" ")[0]}`,
      data: { kind: `team_${kind}`, reference: t.reference },
    });

    // Courriel (Brevo)
    const to_ = list("TEAM_ALERT_EMAILS");
    const key = process.env.BREVO_API_KEY?.trim();
    const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
    if (!to_.length || !key || !senderEmail) return;
    const base = (process.env.BREVO_API_URL?.trim() || "https://api.brevo.com/v3").replace(/\/$/, "");
    const adminUrl = `${(process.env.NEXT_PUBLIC_APP_URL ?? "https://worldsofttransfer.com").replace(/\/$/, "")}/admin/transferts`;
    const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f5f5f6;font-family:Arial,Helvetica,sans-serif;color:#111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:12px;padding:28px">
<tr><td style="font-size:18px;font-weight:600">${esc(kind === "new_order" ? "Nouvelle commande" : "Paiement signalé")} · ${esc(t.reference)}</td></tr>
<tr><td style="padding-top:14px;font-size:15px;line-height:1.5">${esc(line)}</td></tr>
<tr><td style="padding-top:14px;font-size:14px;color:#555">À payer : ${esc(paid)}<br>Destinataire : ${esc(t.beneficiary.fullName)} (${esc(received)})<br>Client : ${esc(t.senderName)} (${esc(t.senderEmail)})</td></tr>
<tr><td style="padding-top:20px"><a href="${esc(adminUrl)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:14px">Ouvrir l'admin</a></td></tr>
</table></td></tr></table></body></html>`;
    const res = await fetch(`${base}/smtp/email`, {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { email: senderEmail, name: process.env.BREVO_SENDER_NAME?.trim() || "WorldSoft Transfer" },
        to: to_.map((email) => ({ email })),
        subject,
        htmlContent: html,
        textContent: `${line}\n\nOuvrir l'admin : ${adminUrl}`,
        tags: [`team-${kind}`],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("[team-alert] Brevo a refusé l'envoi", kind, res.status);
  } catch (error) {
    console.error("[team-alert] alerte impossible", kind, error instanceof Error ? error.message : "erreur");
  }
}
