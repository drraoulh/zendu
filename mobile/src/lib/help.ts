import type { IconName } from "@/components/icons";
import { tr } from "@/lib/i18n";

export type HelpCategory = "transferts" | "paiements" | "compte" | "shipping";

export const HELP_CATEGORIES: { id: HelpCategory; label: string; icon: IconName }[] = [
  { id: "transferts", label: tr("Transferts"), icon: "send" },
  { id: "paiements", label: tr("Paiements"), icon: "wallet" },
  { id: "compte", label: tr("Compte & sécurité"), icon: "lock" },
  { id: "shipping", label: tr("Colis"), icon: "ship" },
];

export type HelpArticle = {
  slug: string;
  category: HelpCategory;
  title: string;
  intro: string;
  sections: { title: string; text: string }[];
  bullets?: { title: string; items: string[] };
  faq?: boolean;
};

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "delai-transfert",
    category: "transferts",
    faq: true,
    title: tr("Combien de temps prend un transfert ?"),
    intro: tr("Le délai dépend surtout du mode de réception choisi. Il est toujours affiché avant le paiement."),
    sections: [
      { title: tr("Mobile Money (Cameroun)"), text: tr("Généralement quelques minutes (MTN Mobile Money, Orange Money).") },
      { title: tr("Alipay, WeChat Pay, Interac"), text: tr("En général en moins de 24 heures.") },
      { title: tr("Virement bancaire"), text: tr("1 à 2 jours ouvrables selon la banque du destinataire.") },
    ],
    bullets: {
      title: tr("Ce qui peut allonger le délai"),
      items: [tr("Une vérification de sécurité supplémentaire"), tr("Un nom qui ne correspond pas au compte du destinataire"), tr("Les fins de semaine et jours fériés (virements)")],
    },
  },
  {
    slug: "frais",
    category: "transferts",
    faq: true,
    title: tr("Quels sont les frais d'envoi ?"),
    intro: tr("Les frais et le taux de change sont calculés pour chaque envoi et affichés dans le simulateur, avant tout paiement."),
    sections: [
      { title: tr("Vers le Cameroun"), text: tr("Aucun frais d'envoi : notre rémunération est comprise dans le taux de change affiché.") },
      { title: tr("Vers la Chine et le Canada"), text: tr("Un petit frais fixe s'ajoute, indiqué avant le paiement.") },
      { title: tr("Ce que vous voyez avant de payer"), text: tr("Le montant envoyé, les frais, le taux appliqué, le total à payer et le montant exact reçu par votre proche.") },
      { title: tr("Durée du devis"), text: tr("Un devis est garanti 15 minutes. Passé ce délai, il est recalculé au taux du moment.") },
      { title: tr("Pas de frais cachés"), text: tr("Le total affiché au récapitulatif est le montant débité.") },
    ],
  },
  {
    slug: "limites",
    category: "transferts",
    title: tr("Montants minimum et maximum"),
    intro: tr("Les limites dépendent de la devise d'envoi."),
    sections: [
      { title: tr("Depuis le Canada (CAD)"), text: tr("De 10 $ à 5 000 $ par envoi.") },
      { title: tr("Depuis le Cameroun et la Chine"), text: tr("Bientôt disponible. Pour l'instant, les envois partent du Canada.") },
    ],
  },
  {
    slug: "rien-recu",
    category: "transferts",
    faq: true,
    title: tr("Mon destinataire n'a rien reçu"),
    intro: tr("Ouvrez le suivi du transfert depuis l'historique : chaque étape y est indiquée en temps réel."),
    sections: [
      { title: tr("Le statut est « En attente de paiement »"), text: tr("Le paiement n'a pas encore été confirmé. Terminez le paiement depuis l'écran de suivi.") },
      { title: tr("Le statut est « Versement envoyé »"), text: tr("L'argent est en route. Pour un virement bancaire, comptez 1 à 2 jours ouvrables.") },
      { title: tr("Toujours rien ?"), text: tr("Contactez-nous avec la référence du transfert (PW-…) : notre équipe vérifie auprès de l'opérateur.") },
    ],
  },
  {
    slug: "payer-carte",
    category: "paiements",
    title: tr("Comment payer mon transfert ?"),
    intro: tr("Les envois partent du Canada et se paient par virement Interac, depuis votre banque canadienne."),
    sections: [
      { title: tr("Virement Interac"), text: tr("Envoyez le montant exact depuis votre banque en indiquant la référence du transfert (PW-…) en message. Le versement part dès la réception du virement.") },
      { title: tr("Carte de débit"), text: tr("Proposée seulement dans la version de démonstration (aucune carte n'est débitée). Les cartes de crédit ne sont pas acceptées.") },
      { title: tr("Reçu"), text: tr("Le reçu reste disponible dans l'appli et vous êtes prévenu par courriel à chaque étape (paiement reçu, argent livré).") },
    ],
  },
  {
    slug: "verifier-identite",
    category: "compte",
    faq: true,
    title: tr("Comment vérifier mon identité ?"),
    intro: tr("La réglementation sur les transferts d'argent impose de vérifier l'identité de chaque client avant son premier envoi."),
    sections: [
      { title: tr("Ce qu'il vous faut"), text: tr("Une pièce d'identité valide (passeport, carte d'identité, permis ou titre de séjour selon votre pays) et quelques secondes pour un selfie.") },
      { title: tr("Durée"), text: tr("La vérification prend généralement quelques minutes. Vous êtes averti dès qu'elle est terminée.") },
      { title: tr("Vos données"), text: tr("Les photos servent uniquement à vérifier votre identité et ne sont jamais partagées à des fins commerciales.") },
    ],
  },
  {
    slug: "securiser-compte",
    category: "compte",
    title: tr("Sécuriser mon compte"),
    intro: tr("Plusieurs protections sont disponibles dans Profil → Sécurité."),
    sections: [
      { title: tr("Vérification en deux étapes"), text: tr("Un code envoyé par courriel est demandé à chaque connexion.") },
      { title: tr("Face ID / empreinte et code PIN"), text: tr("Verrouillez l'ouverture de l'appli sur votre téléphone.") },
      { title: tr("Mot de passe"), text: tr("Utilisez un mot de passe unique, que vous n'utilisez sur aucun autre site.") },
    ],
  },
  {
    slug: "suivi-colis",
    category: "shipping",
    faq: true,
    title: tr("Comment suivre mon colis ?"),
    intro: tr("Ouvrez l'onglet Colis et saisissez le numéro de suivi (PWS-…) indiqué sur votre reçu d'expédition."),
    sections: [
      { title: tr("Étapes du suivi"), text: tr("Colis reçu, en transit, dédouanement, en livraison, puis livré. Chaque étape affiche sa date et son lieu.") },
      { title: tr("Numéro introuvable"), text: tr("Vérifiez le numéro sur votre reçu. Il peut falloir quelques heures après le dépôt pour qu'il apparaisse.") },
      { title: tr("Expédier un colis"), text: tr("Les demandes d'expédition se font sur le site PWFINTECH ou auprès de l'équipe.") },
    ],
  },
];

export function findArticle(slug: string) {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}
