import { router } from "expo-router";
import { useCallback } from "react";
import type { Transfer } from "./api";
import { useSession } from "./session";
import { useStore, type Recipient } from "./store";

const digits = (s?: string | null) => (s ?? "").replace(/\D/g, "");
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * « Renvoyer » (comme Taptap Send / Remitly) : même trajet, même montant, même bénéficiaire, puis
 * l'écran de vérification avec un devis à jour. Le bénéficiaire enregistré est repris s'il existe ;
 * sinon il est reconstitué depuis le transfert (le numéro complet d'un compte bancaire n'étant pas
 * renvoyé par l'API, un virement bancaire repasse par le choix du destinataire).
 */
export function useResend() {
  const { profile } = useSession();
  const { recipients, setDraft } = useStore();
  const kyc = profile?.kyc ?? "none";

  const resend = useCallback(
    (t: Transfer) => {
      if (kyc === "none" || kyc === "rejected") return router.push("/kyc");
      const b = t.beneficiary;
      const saved = recipients.find(
        (r) =>
          r.country === t.destCountry &&
          r.network === b.network &&
          same(r.fullName, b.fullName) &&
          (b.network === "BANK" ? (r.accountNumber ?? "").slice(-4).toUpperCase() === (b.accountMasked ?? "").slice(-4).toUpperCase() : digits(r.phone) === digits(b.phone)),
      );
      const rebuilt: Recipient | null =
        b.network !== "BANK" && b.phone ? { id: "draft", fullName: b.fullName, phone: b.phone, network: b.network, country: t.destCountry } : null;
      const recipient = saved ?? rebuilt;
      setDraft({ corridorId: t.corridorId, sendAmount: t.sendAmountCad, quote: null, recipient, recipientFromHome: false, saveRecipient: false, cardId: null });
      router.push(recipient ? "/send/review" : "/send/recipient");
    },
    [kyc, recipients, setDraft],
  );

  /** Vérification en cours : l'envoi reste bloqué, comme sur l'accueil. */
  return { resend, canResend: kyc !== "pending" };
}
