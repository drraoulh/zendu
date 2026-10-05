import type { Transfer } from "./api";
import { money, networkLabel } from "./format";
import type { IconName } from "@/components/icons";
import type { Profile } from "./session";
import type { ServiceRequest } from "./store";

export type AppNotification = { id: string; icon: IconName; tone: "brand" | "success" | "warn" | "danger"; title: string; text: string; at: string; href?: string };

/** Notifications calculées à partir de l'état réel des transferts, du KYC et des demandes de service. */
export function buildNotifications(transfers: Transfer[], profile: Profile | null, requests: ServiceRequest[]): AppNotification[] {
  const list: AppNotification[] = [];
  for (const t of transfers) {
    const amount = money(t.receiveAmountXaf, t.receiveCurrency);
    const at = t.events?.length ? t.events[t.events.length - 1].createdAt : t.createdAt;
    if (t.status === "delivered") {
      list.push({ id: `${t.id}:delivered`, icon: "check", tone: "success", title: "Transfert livré", text: `${t.beneficiary.fullName} a reçu ${amount} · Réf. ${t.reference}`, at, href: `/transfer/${t.id}` });
    } else if (t.status === "awaiting_payment") {
      list.push({ id: `${t.id}:awaiting`, icon: "clock", tone: "warn", title: "Paiement en attente", text: `Votre envoi à ${t.beneficiary.fullName} attend votre paiement.`, at, href: `/transfer/${t.id}` });
    } else if (["payout_failed", "payment_mismatch"].includes(t.status)) {
      list.push({ id: `${t.id}:${t.status}`, icon: "alert", tone: "danger", title: "Incident sur un transfert", text: `Réf. ${t.reference} : notre équipe vous contacte rapidement.`, at, href: `/transfer/${t.id}` });
    } else if (!["expired", "cancelled"].includes(t.status)) {
      const bank = t.beneficiary.network === "BANK";
      list.push({
        id: `${t.id}:progress`,
        icon: bank ? "bank" : "send",
        tone: "brand",
        title: bank ? "Virement bancaire en traitement" : "Transfert en cours",
        text: bank
          ? `Votre envoi à ${t.beneficiary.fullName} arrivera sous 1 à 2 jours ouvrables.`
          : `${amount} en route vers ${t.beneficiary.fullName} (${networkLabel(t.beneficiary.network)}).`,
        at,
        href: `/transfer/${t.id}`,
      });
    }
  }
  if (profile?.kyc === "verified" && profile.kycVerifiedAt) {
    list.push({ id: "kyc:verified", icon: "shield", tone: "success", title: "Vérification d'identité terminée", text: "Votre identité est confirmée. Vous pouvez envoyer de l'argent.", at: profile.kycVerifiedAt });
  }
  for (const r of requests) {
    const titles: Record<ServiceRequest["kind"], string> = {
      shipping_quote: "Demande d'expédition reçue",
      finance_appointment: "Rendez-vous confirmé",
      tech_project: "Demande envoyée",
      contact: "Message envoyé au support",
    };
    list.push({ id: `req:${r.reference}`, icon: r.kind === "shipping_quote" ? "ship" : r.kind === "finance_appointment" ? "finance" : r.kind === "tech_project" ? "tech" : "mail", tone: "brand", title: titles[r.kind], text: `Référence ${r.reference}`, at: r.createdAt });
  }
  return list.sort((a, b) => b.at.localeCompare(a.at));
}

export function dayGroup(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.floor((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
  if (diff <= 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  if (diff < 7) return "Cette semaine";
  return "Plus ancien";
}
