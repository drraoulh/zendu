/**
 * Envoi des codes de vérification (connexion en deux étapes).
 *
 * Fournisseur : OTP_WEBHOOK_URL — le serveur y envoie en POST JSON
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

/** Un fournisseur d'envoi est-il configuré ? */
export function otpProviderConfigured(): boolean {
  return webhookUrl() !== null;
}

/** Mode démo : pas de fournisseur et OTP_DEMO ≠ "false" (le code est alors renvoyé à l'appli). */
export function otpDemoMode(): boolean {
  return !otpProviderConfigured() && process.env.OTP_DEMO?.trim().toLowerCase() !== "false";
}

export async function deliverOtp(message: OtpMessage): Promise<OtpDelivery> {
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
      throw new OtpDeliveryError("otp_send_failed", "Envoi du code impossible. Réessayez dans un instant.");
    }
    if (!res.ok) {
      console.error("[otp] webhook refusé", res.status, message.channel);
      throw new OtpDeliveryError("otp_send_failed", "Envoi du code impossible. Réessayez dans un instant.");
    }
    return { delivered: true };
  }
  if (otpDemoMode()) return { delivered: false, demoCode: message.code };
  throw new OtpDeliveryError("otp_unavailable", "La vérification par code est momentanément indisponible. Contactez le support.");
}
