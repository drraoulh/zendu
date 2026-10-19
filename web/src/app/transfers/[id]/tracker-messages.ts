import { defineMessages } from "@/i18n/define";

/** Textes propres au suivi web : instructions Interac et versement fait par l'équipe. */
export const trackerMessages = defineMessages({
  fr: {
    interacTitle: "Payez par virement Interac",
    interacBody:
      "Depuis votre appli bancaire, envoyez un virement Interac du montant exact à l'adresse ci-dessous, avec la référence comme message. Notre équipe confirme la réception, puis le versement part.",
    interacEmail: "Adresse du virement",
    interacName: "Votre banque affichera « {name} » : c'est bien notre compte de réception.",
    interacAmount: "Montant exact",
    interacMessage: "Message (référence)",
    interacDeadline: "À envoyer avant le {date}, sinon le transfert expire.",
    interacNoAddress: "L'adresse de dépôt Interac n'est pas encore configurée : ne payez pas pour l'instant.",
    copy: "Copier",
    copied: "Copié",
    manualTitle: "Versement en cours de traitement",
    manualBody:
      "Votre paiement est confirmé. Notre équipe effectue le versement vers le {network} du destinataire. Cette page se met à jour automatiquement.",
    payoutWaitTitle: "Versement en cours",
    payoutWaitBody: "Votre paiement est confirmé. Le versement vers le destinataire est en cours ; cette page se met à jour automatiquement.",
    expiredTitle: "Transfert expiré",
    expiredBody:
      "Nous n'avons pas reçu le paiement dans les 24 heures. Si vous avez déjà envoyé le virement, écrivez-nous à {email} en citant la référence {ref}.",
  },
  en: {
    interacTitle: "Pay by Interac e-Transfer",
    interacBody:
      "From your banking app, send an Interac e-Transfer of the exact amount to the address below, with the reference as the message. Our team confirms receipt, then the payout starts.",
    interacEmail: "Send to",
    interacName: "Your bank will show “{name}”: this is our receiving account.",
    interacAmount: "Exact amount",
    interacMessage: "Message (reference)",
    interacDeadline: "Send it before {date}, otherwise the transfer expires.",
    interacNoAddress: "The Interac deposit address is not configured yet: do not pay for now.",
    copy: "Copy",
    copied: "Copied",
    manualTitle: "Payout being processed",
    manualBody:
      "Your payment is confirmed. Our team is making the payout to the recipient's {network}. This page updates automatically.",
    payoutWaitTitle: "Payout in progress",
    payoutWaitBody: "Your payment is confirmed. The payout to the recipient is in progress; this page updates automatically.",
    expiredTitle: "Transfer expired",
    expiredBody:
      "We did not receive the payment within 24 hours. If you already sent the transfer, write to us at {email} quoting reference {ref}.",
  },
});
