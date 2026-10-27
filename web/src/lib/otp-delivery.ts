import { isLiveMode } from "@/lib/mode";
/**
 * Envoi des codes de vérification (connexion en deux étapes).
 *
 * Fournisseurs : Brevo (BREVO_API_KEY, voir plus bas), sinon OTP_WEBHOOK_URL — le serveur y envoie en POST JSON
 *   { channel: "sms" | "email", to, code, purpose, expiresMinutes, firstName, locale }
 * avec `Authorization: Bearer <OTP_WEBHOOK_SECRET>` (fonction Supabase, Zapier/Make, petit service
 * Twilio / Resend…). Le webhook doit répondre 2xx une fois le message accepté.
 *
 * Mode démo : AUCUN fournisseur configuré et OTP_DEMO différent de "false" → le code n'est envoyé
 * nulle part et l'API le renvoie dans `demoCode` pour que l'appli de démonstration l'affiche.
 * Production : définir OTP_WEBHOOK_URL (le code n'est alors jamais renvoyé), ou OTP_DEMO=false
 * pour refuser les connexions tant qu'aucun fournisseur n'est branché.
 *
 * Le code n'est jamais journalisé.
 */

export type OtpChannel = "sms" | "email";

export type OtpMessage = {
  channel: OtpChannel;
  /** Numéro E.164 approximatif ou courriel. */
  to: string;
  code: string;
  purpose: "login";
  expiresMinutes: number;
  firstName: string;
};

export type OtpDelivery = { delivered: true } | { delivered: false; demoCode: string };

export class OtpDeliveryError extends Error {
  code: "otp_unavailable" | "otp_send_failed";
  constructor(code: "otp_unavailable" | "otp_send_failed", message: string) {
    super(message);
    this.code = code;
  }
}

function webhookUrl(): string | null {
  return process.env.OTP_WEBHOOK_URL?.trim() || null;
}

/* ---------------------------------------------------------------------------------------------- */
/* Brevo (https://developers.brevo.com) : courriel transactionnel, et SMS si BREVO_SMS_SENDER est    */
/* défini (crédits SMS achetés chez Brevo). Variables : BREVO_API_KEY, BREVO_SENDER_EMAIL,          */
/* BREVO_SENDER_NAME, BREVO_SMS_SENDER (11 caractères max, ex. « PAULWORLD »).                       */
/* ---------------------------------------------------------------------------------------------- */

function brevo() {
  const key = process.env.BREVO_API_KEY?.trim();
  if (!key) return null;
  return {
    key,
    base: (process.env.BREVO_API_URL?.trim() || "https://api.brevo.com/v3").replace(/\/$/, ""),
    senderEmail: process.env.BREVO_SENDER_EMAIL?.trim() || "",
    senderName: process.env.BREVO_SENDER_NAME?.trim() || "WorldSoft Transfer",
    smsSender: process.env.BREVO_SMS_SENDER?.trim().slice(0, 11) || "",
  };
}

function canSend(channel: OtpChannel): boolean {
  const b = brevo();
  if (channel === "email" && b?.senderEmail) return true;
  if (channel === "sms" && b?.smsSender) return true;
  return webhookUrl() !== null;
}

/** Un fournisseur d'envoi est-il configuré ? */
export function otpProviderConfigured(): boolean {
  return canSend("email") || canSend("sms");
}

/**
 * Canal réellement utilisé : si le canal demandé n'a pas de fournisseur (ex. SMS sans crédits Brevo)
 * mais que l'autre en a un, on bascule dessus (le code part alors par courriel).
 */
export function resolveChannel(requested: OtpChannel): OtpChannel {
  if (canSend(requested) || !otpProviderConfigured()) return requested;
  return requested === "sms" ? "email" : "sms";
}

/**
 * Mode démo du code de connexion (le code est renvoyé à l'appli au lieu d'être envoyé) : jamais en
 * mode réel ; ailleurs, seulement sans fournisseur et sur demande (OTP_DEMO="true"), ou en
 * développement local. Sans fournisseur en mode réel, la connexion échoue : la 2FA n'est jamais
 * contournée en silence.
 */
export function otpDemoMode(): boolean {
  if (otpProviderConfigured() || isLiveMode()) return false;
  return process.env.OTP_DEMO?.trim().toLowerCase() === "true" || process.env.NODE_ENV !== "production";
}

const SEND_FAILED = "Envoi du code impossible. Réessayez dans un instant.";

function emailHtml(m: OtpMessage) {
  const name = m.firstName.replace(/[<>&"]/g, "");
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f5f8ff;font-family:Arial,Helvetica,sans-serif;color:#0a1838">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px">
<tr><td style="font-size:20px;font-weight:bold;color:#061a52">WorldSoft <span style="color:#0b4dff">Transfer</span></td></tr>
<tr><td style="padding-top:24px;font-size:16px">Bonjour ${name},</td></tr>
<tr><td style="padding-top:8px;font-size:15px;color:#4a5878">Voici votre code de connexion :</td></tr>
<tr><td style="padding:20px 0"><div style="font-size:34px;font-weight:bold;letter-spacing:8px;color:#061a52;background:#eef3ff;border-radius:12px;padding:16px;text-align:center">${m.code}</div></td></tr>
<tr><td style="font-size:14px;color:#4a5878">Il expire dans ${m.expiresMinutes} minutes. Ne le communiquez à personne : l'équipe ne vous le demandera jamais.</td></tr>
<tr><td style="padding-top:16px;font-size:13px;color:#8090ad">Vous n'avez pas essayé de vous connecter ? Changez votre mot de passe depuis l'application.</td></tr>
</table></td></tr></table></body></html>`;
}

async function brevoPost(path: string, key: string, body: unknown, base: string) {
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new OtpDeliveryError("otp_send_failed", SEND_FAILED);
  }
  if (!res.ok) {
    // Ni la clé ni le code ne sont journalisés : seulement le statut et le message d'erreur de Brevo.
    const detail = await res.text().catch(() => "");
    console.error("[otp] Brevo a refusé l'envoi", path, res.status, detail.slice(0, 200));
    throw new OtpDeliveryError("otp_send_failed", SEND_FAILED);
  }
}

async function sendWithBrevo(message: OtpMessage): Promise<boolean> {
  const b = brevo();
  if (!b) return false;
  if (message.channel === "email" && b.senderEmail) {
    await brevoPost(
      "/smtp/email",
      b.key,
      {
        sender: { email: b.senderEmail, name: b.senderName },
        to: [{ email: message.to, name: message.firstName }],
        subject: "Votre code de connexion WorldSoft Transfer",
        htmlContent: emailHtml(message),
        textContent: `Bonjour ${message.firstName},\n\nVotre code de connexion WorldSoft Transfer : ${message.code}\nIl expire dans ${message.expiresMinutes} minutes. Ne le communiquez à personne.`,
        tags: ["otp-login"],
      },
      b.base,
    );
    return true;
  }
  if (message.channel === "sms" && b.smsSender) {
    await brevoPost(
      "/transactionalSMS/sms",
      b.key,
      {
        sender: b.smsSender,
        recipient: message.to.replace(/[^\d]/g, ""),
        content: `WorldSoft Transfer : votre code est ${message.code}. Valable ${message.expiresMinutes} min. Ne le partagez avec personne.`,
        type: "transactional",
        tag: "otp-login",
      },
      b.base,
    );
    return true;
  }
  return false;
}

export async function deliverOtp(message: OtpMessage): Promise<OtpDelivery> {
  if (await sendWithBrevo(message)) return { delivered: true };
  const url = webhookUrl();
  if (url) {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.OTP_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.OTP_WEBHOOK_SECRET}` } : {}),
        },
        body: JSON.stringify({ ...message, locale: "fr" }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new OtpDeliveryError("otp_send_failed", SEND_FAILED);
    }
    if (!res.ok) {
      console.error("[otp] webhook refusé", res.status, message.channel);
      throw new OtpDeliveryError("otp_send_failed", SEND_FAILED);
    }
    return { delivered: true };
  }
  if (otpDemoMode()) return { delivered: false, demoCode: message.code };
  throw new OtpDeliveryError("otp_unavailable", "La vérification par code est momentanément indisponible. Contactez le support.");
}

/**
 * Diagnostic (espace équipe) : envoie un courriel de test par Brevo et renvoie la réponse brute de Brevo
 * (statut + message d'erreur), sans jamais exposer la clé.
 */
export async function brevoTestEmail(to: string): Promise<{ ok: boolean; status: number | null; detail: string; sender: string | null }> {
  const b = brevo();
  if (!b) return { ok: false, status: null, detail: "BREVO_API_KEY absent dans Vercel.", sender: null };
  if (!b.senderEmail) return { ok: false, status: null, detail: "BREVO_SENDER_EMAIL absent dans Vercel.", sender: null };
  try {
    const res = await fetch(`${b.base}/smtp/email`, {
      method: "POST",
      headers: { "api-key": b.key, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { email: b.senderEmail, name: b.senderName },
        to: [{ email: to }],
        subject: "Test d'envoi WorldSoft Transfer",
        textContent: "Ceci est un courriel de test envoyé depuis l'espace équipe. Si vous le recevez, l'envoi des codes fonctionne.",
        tags: ["admin-test"],
      }),
      signal: AbortSignal.timeout(10000),
    });
    const detail = (await res.text().catch(() => "")).slice(0, 500);
    return { ok: res.ok, status: res.status, detail, sender: b.senderEmail };
  } catch (err) {
    return { ok: false, status: null, detail: `Brevo injoignable : ${err instanceof Error ? err.message : "erreur réseau"}`, sender: b.senderEmail };
  }
}
