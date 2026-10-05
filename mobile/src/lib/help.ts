import type { IconName } from "@/components/icons";

export type HelpCategory = "transferts" | "paiements" | "compte" | "shipping";

export const HELP_CATEGORIES: { id: HelpCategory; label: string; icon: IconName }[] = [
  { id: "transferts", label: "Transferts", icon: "send" },
  { id: "paiements", label: "Paiements", icon: "wallet" },
  { id: "compte", label: "Compte & sécurité", icon: "lock" },
  { id: "shipping", label: "Colis", icon: "ship" },
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
    title: "Combien de temps prend un transfert ?",
    intro: "Le délai dépend surtout du mode de réception choisi. Il est toujours affiché avant le paiement.",
    sections: [
      { title: "Mobile Money (Cameroun)", text: "Généralement quelques minutes (MTN Mobile Money, Orange Money)." },
      { title: "Alipay, WeChat Pay, Interac", text: "En général en moins de 24 heures." },
      { title: "Virement bancaire", text: "1 à 2 jours ouvrables selon la banque du destinataire." },
    ],
    bullets: {
      title: "Ce qui peut allonger le délai",
      items: ["Une vérification de sécurité supplémentaire", "Un nom qui ne correspond pas au compte du destinataire", "Les fins de semaine et jours fériés (virements)"],
    },
  },
  {
    slug: "frais",
    category: "transferts",
    faq: true,
    title: "Quels sont les frais d'envoi ?",
    intro: "Les frais et le taux de change sont calculés pour chaque envoi et affichés dans le simulateur, avant tout paiement.",
    sections: [
      { title: "Ce que vous voyez avant de payer", text: "Le montant envoyé, les frais, le taux appliqué, le total à payer et le montant exact reçu par votre proche." },
      { title: "Durée du devis", text: "Un devis est garanti 15 minutes. Passé ce délai, il est recalculé au taux du moment." },
      { title: "Pas de frais cachés", text: "Le total affiché au récapitulatif est le montant débité." },
    ],
  },
  {
    slug: "limites",
    category: "transferts",
    title: "Montants minimum et maximum",
    intro: "Les limites dépendent de la devise d'envoi.",
    sections: [
      { title: "Depuis le Canada (CAD)", text: "De 10 $ à 5 000 $ par envoi." },
      { title: "Depuis le Cameroun (FCFA)", text: "De 5 000 à 3 000 000 FCFA par envoi." },
      { title: "Depuis la Chine (CNY)", text: "De 50 à 30 000 CNY par envoi." },
    ],
  },
  {
    slug: "rien-recu",
    category: "transferts",
    faq: true,
    title: "Mon destinataire n'a rien reçu",
    intro: "Ouvrez le suivi du transfert depuis l'historique : chaque étape y est indiquée en temps réel.",
    sections: [
      { title: "Le statut est « En attente de paiement »", text: "Le paiement n'a pas encore été confirmé. Terminez le paiement depuis l'écran de suivi." },
      { title: "Le statut est « Versement envoyé »", text: "L'argent est en route. Pour un virement bancaire, comptez 1 à 2 jours ouvrables." },
      { title: "Toujours rien ?", text: "Contactez-nous avec la référence du transfert (PW-…) : notre équipe vérifie auprès de l'opérateur." },
    ],
  },
  {
    slug: "payer-carte",
    category: "paiements",
    title: "Comment payer mon transfert ?",
    intro: "Vous payez par carte Visa ou Mastercard. Le virement Interac arrive bientôt.",
    sections: [
      { title: "Sécurité", text: "Le paiement est protégé par 3-D Secure. Seuls les 4 derniers chiffres de votre carte sont conservés." },
      { title: "Reçu", text: "Un reçu est envoyé par courriel et reste disponible dans l'appli." },
    ],
  },
  {
    slug: "verifier-identite",
    category: "compte",
    faq: true,
    title: "Comment vérifier mon identité ?",
    intro: "La réglementation sur les transferts d'argent impose de vérifier l'identité de chaque client avant son premier envoi.",
    sections: [
      { title: "Ce qu'il vous faut", text: "Une pièce d'identité valide (passeport, carte d'identité, permis ou titre de séjour selon votre pays) et quelques secondes pour un selfie." },
      { title: "Durée", text: "La vérification prend généralement quelques minutes. Vous êtes averti dès qu'elle est terminée." },
      { title: "Vos données", text: "Les photos servent uniquement à vérifier votre identité et ne sont jamais partagées à des fins commerciales." },
    ],
  },
  {
    slug: "securiser-compte",
    category: "compte",
    title: "Sécuriser mon compte",
    intro: "Plusieurs protections sont disponibles dans Profil → Sécurité.",
    sections: [
      { title: "Vérification en deux étapes", text: "Un code est demandé à chaque connexion." },
      { title: "Face ID / empreinte et code PIN", text: "Verrouillez l'ouverture de l'appli sur votre téléphone." },
      { title: "Mot de passe", text: "Utilisez un mot de passe unique, que vous n'utilisez sur aucun autre site." },
    ],
  },
  {
    slug: "suivi-colis",
    category: "shipping",
    faq: true,
    title: "Comment suivre mon colis ?",
    intro: "Ouvrez l'onglet Colis et saisissez le numéro de suivi (PWS-…) indiqué sur votre reçu d'expédition.",
    sections: [
      { title: "Étapes du suivi", text: "Colis reçu, en transit, dédouanement, en livraison, puis livré. Chaque étape affiche sa date et son lieu." },
      { title: "Numéro introuvable", text: "Vérifiez le numéro sur votre reçu. Il peut falloir quelques heures après le dépôt pour qu'il apparaisse." },
      { title: "Expédier un colis", text: "Les demandes d'expédition se font sur le site PWFINTECH ou auprès de l'équipe." },
    ],
  },
];

export function findArticle(slug: string) {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}
