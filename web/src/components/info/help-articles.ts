/**
 * Articles du centre d'aide (/aide et /aide/[slug]).
 *
 * Corps : paragraphes séparés par une ligne vide, lignes « - » = puces.
 * Variables remplacées à l'affichage : {min} {max} {flat} {percent} {margin} {ttl}
 * {countries} {hours} {registration} — calculées depuis les mêmes sources que le site
 * (corridors, fees, quote, company). Aucune donnée inventée.
 */

export type HelpCategory = "transfer" | "payments" | "account" | "shipping" | "finances" | "tech" | "company";

export const HELP_CATEGORIES: HelpCategory[] = ["transfer", "payments", "account", "shipping", "finances", "tech", "company"];

export type HelpLinkKey =
  | "linkFees"
  | "linkCountries"
  | "linkApp"
  | "linkSimulator"
  | "linkContact"
  | "linkPrivacy"
  | "linkTerms"
  | "linkShippingQuote"
  | "linkShippingTrack"
  | "linkShipping"
  | "linkFinanceAppt"
  | "linkFinances"
  | "linkTechProject"
  | "linkTech"
  | "linkAbout";

export const HELP_LINKS: Record<HelpLinkKey, string> = {
  linkFees: "/frais",
  linkCountries: "/pays",
  linkApp: "/application",
  linkSimulator: "/#simulateur",
  linkContact: "/contact",
  linkPrivacy: "/confidentialite",
  linkTerms: "/conditions",
  linkShippingQuote: "/shipping/devis",
  linkShippingTrack: "/shipping/suivi",
  linkShipping: "/shipping",
  linkFinanceAppt: "/finances/rendez-vous",
  linkFinances: "/finances",
  linkTechProject: "/technologies/projet",
  linkTech: "/technologies",
  linkAbout: "/a-propos",
};

/** Sujet présélectionné sur /contact selon la catégorie. */
export const CATEGORY_SUBJECT: Record<HelpCategory, string> = {
  transfer: "transfert",
  payments: "transfert",
  account: "transfert",
  shipping: "shipping",
  finances: "finances",
  tech: "technologies",
  company: "autre",
};

type Text = { q: string; a: string };

export type HelpArticle = {
  slug: string;
  category: HelpCategory;
  links: HelpLinkKey[];
  fr: Text;
  en: Text;
  es?: Partial<Text>;
  zh?: Partial<Text>;
};

export const HELP_ARTICLES: HelpArticle[] = [
  /* ------------------------------------------------------------------ */
  /* WorldSoft Transfer & transferts                                     */
  /* ------------------------------------------------------------------ */
  {
    slug: "qu-est-ce-que-worldsoft-transfer",
    category: "transfer",
    links: ["linkApp", "linkFees"],
    fr: {
      q: "Qu'est-ce que WorldSoft Transfer ?",
      a: "WorldSoft Transfer est l'application mobile de transfert d'argent de PWFINTECH (« une solution PWFINTECH »). Elle permet d'envoyer de l'argent entre {countries} pays — le Canada, le Cameroun et la Chine — sur un portefeuille mobile money (MTN, Orange), Interac, Alipay, WeChat Pay ou un compte bancaire selon le pays du destinataire.\n\nDans l'application, vous enregistrez vos destinataires, voyez les frais et le taux avant de payer, puis suivez chaque transfert jusqu'à sa livraison.",
    },
    en: {
      q: "What is WorldSoft Transfer?",
      a: "WorldSoft Transfer is PWFINTECH's money transfer mobile app (“a PWFINTECH solution”). It lets you send money between {countries} countries — Canada, Cameroon and China — to a mobile money wallet (MTN, Orange), Interac, Alipay, WeChat Pay or a bank account depending on the recipient's country.\n\nIn the app, you save your recipients, see the fees and rate before paying, then track each transfer until it's delivered.",
    },
    es: { q: "¿Qué es WorldSoft Transfer?" },
    zh: { q: "什么是 WorldSoft Transfer？" },
  },
  {
    slug: "envoyer-depuis-le-site",
    category: "transfer",
    links: ["linkSimulator", "linkApp"],
    fr: {
      q: "Puis-je envoyer de l'argent depuis le site web ?",
      a: "Le site sert à simuler un envoi : vous choisissez le pays et le montant, et vous voyez immédiatement les frais, le taux et le montant reçu.\n\nL'envoi lui-même se fait dans l'application WorldSoft Transfer. Le bouton « Envoyer » du simulateur vous y conduit : App Store sur iPhone, Google Play sur Android, ou la page de l'application (avec un code QR) sur ordinateur.",
    },
    en: {
      q: "Can I send money from the website?",
      a: "The website is for simulating a transfer: pick the country and amount, and you instantly see the fees, rate and amount received.\n\nThe transfer itself happens in the WorldSoft Transfer app. The simulator's “Send” button takes you there: App Store on iPhone, Google Play on Android, or the app page (with a QR code) on a computer.",
    },
  },
  {
    slug: "telecharger-application",
    category: "transfer",
    links: ["linkApp"],
    fr: {
      q: "Comment obtenir l'application WorldSoft Transfer ?",
      a: "Rendez-vous sur la page de l'application : vous y trouverez les boutons App Store et Google Play, ainsi qu'un code QR à scanner depuis votre téléphone.\n\nSi les boutons affichent « Bientôt », l'application n'est pas encore publiée sur les stores. Inscrivez-vous alors à la liste d'attente avec votre courriel : nous vous écrirons dès sa sortie, et uniquement à ce sujet.",
    },
    en: {
      q: "How do I get the WorldSoft Transfer app?",
      a: "Go to the app page: you'll find the App Store and Google Play buttons, plus a QR code to scan with your phone.\n\nIf the buttons say “Soon”, the app isn't published on the stores yet. Join the waitlist with your email: we'll write to you as soon as it's out, and only about that.",
    },
  },
  {
    slug: "pays-desservis",
    category: "transfer",
    links: ["linkCountries", "linkFees"],
    fr: {
      q: "Vers quels pays puis-je envoyer de l'argent ?",
      a: "WorldSoft Transfer relie actuellement {countries} pays : le Canada, le Cameroun et la Chine. Chacun peut envoyer vers les deux autres et en recevoir.\n\nLa page « Nos pays » présente chaque pays : devise, modes de réception (mobile money, Interac, Alipay, WeChat Pay, compte bancaire), délais et frais. Un autre pays vous intéresse ? Écrivez-nous : vos demandes nous aident à choisir les prochains pays.",
    },
    en: {
      q: "Which countries can I send money to?",
      a: "WorldSoft Transfer currently connects {countries} countries: Canada, Cameroon and China. Each one can send to and receive from the other two.\n\nThe “Our countries” page details each one: currency, payout methods (mobile money, Interac, Alipay, WeChat Pay, bank account), delivery times and fees. Interested in another country? Write to us: your requests help us choose the next countries.",
    },
  },
  {
    slug: "delais-de-livraison",
    category: "transfer",
    links: ["linkFees", "linkCountries"],
    fr: {
      q: "Combien de temps prend un transfert ?",
      a: "Le délai dépend du mode de réception :\n- Mobile money : en général quelques minutes une fois le paiement confirmé.\n- Virement bancaire : en général 1 à 2 jours ouvrables.\n\nCes délais sont des estimations. Une vérification de sécurité, un jour férié, l'opérateur ou la banque du destinataire peuvent les allonger. Le délai estimé est toujours affiché avant que vous confirmiez.",
    },
    en: {
      q: "How long does a transfer take?",
      a: "It depends on the payout method:\n- Mobile money: usually a few minutes once payment is confirmed.\n- Bank transfer: usually 1–2 business days.\n\nThese are estimates. A security check, a public holiday, or the recipient's operator or bank can make them longer. The estimated delivery time is always shown before you confirm.",
    },
  },
  {
    slug: "modes-de-reception",
    category: "transfer",
    links: ["linkCountries"],
    fr: {
      q: "Comment mon proche reçoit-il l'argent ?",
      a: "Selon le pays, deux modes sont proposés :\n- Mobile money (MTN MoMo, Orange Money, Wave, M-Pesa, Airtel Money…) : l'argent arrive sur le portefeuille lié au numéro de téléphone du destinataire.\n- Compte bancaire : virement sur le compte du destinataire.\n\nLes modes disponibles pour chaque pays sont indiqués sur sa fiche et dans l'application.",
    },
    en: {
      q: "How does my recipient get the money?",
      a: "Depending on the country, two methods are offered:\n- Mobile money (MTN MoMo, Orange Money, Wave, M-Pesa, Airtel Money…): the money goes to the wallet linked to the recipient's phone number.\n- Bank account: a transfer to the recipient's account.\n\nThe methods available for each country are shown on its page and in the app.",
    },
  },
  {
    slug: "suivre-un-transfert",
    category: "transfer",
    links: ["linkApp"],
    fr: {
      q: "Comment suivre mon transfert ?",
      a: "Chaque transfert reçoit une référence unique. Dans l'application WorldSoft Transfer, vous voyez son statut à chaque étape : paiement confirmé, en cours d'envoi, livré, avec un reçu détaillé.\n\nSi un statut ne bouge plus au-delà du délai estimé, contactez-nous en indiquant la référence : c'est le moyen le plus rapide de retrouver votre envoi.",
    },
    en: {
      q: "How do I track my transfer?",
      a: "Each transfer gets a unique reference. In the WorldSoft Transfer app, you see its status at every step: payment confirmed, being sent, delivered, with a detailed receipt.\n\nIf a status stops moving beyond the estimated delivery time, contact us with the reference: it's the fastest way to find your transfer.",
    },
  },
  {
    slug: "erreur-destinataire",
    category: "transfer",
    links: ["linkContact"],
    fr: {
      q: "Je me suis trompé de numéro ou de nom de destinataire",
      a: "Contactez-nous le plus vite possible en indiquant la référence du transfert et l'information correcte.\n\nTant que les fonds n'ont pas été versés, il est souvent possible de corriger ou d'arrêter le transfert. Une fois l'argent versé sur un portefeuille ou un compte, nous ne pouvons généralement plus l'annuler ; nous ferons toutefois notre possible pour vous aider auprès de l'opérateur.\n\nPour éviter ce cas, vérifiez le numéro (avec l'indicatif du pays) et le nom exact du titulaire avant de confirmer.",
    },
    en: {
      q: "I entered the wrong recipient number or name",
      a: "Contact us as soon as possible with the transfer reference and the correct information.\n\nAs long as the funds haven't been paid out, it's often possible to correct or stop the transfer. Once the money has been paid to a wallet or account, we generally can no longer cancel it; we'll still do our best to help with the operator.\n\nTo avoid this, check the number (with the country code) and the account holder's exact name before confirming.",
    },
  },
  {
    slug: "annuler-un-transfert",
    category: "transfer",
    links: ["linkContact", "linkTerms"],
    fr: {
      q: "Puis-je annuler un transfert ou être remboursé ?",
      a: "Un transfert peut être annulé tant que les fonds n'ont pas été versés au destinataire. Écrivez-nous avec la référence du transfert : nous vérifions son état et vous indiquons la marche à suivre.\n\nSi un transfert ne peut pas être livré (par exemple un compte fermé ou un numéro invalide), notre équipe vous contacte pour corriger les informations ou procéder au remboursement, selon nos conditions d'utilisation.",
    },
    en: {
      q: "Can I cancel a transfer or get a refund?",
      a: "A transfer can be cancelled as long as the funds haven't been paid out to the recipient. Write to us with the transfer reference: we check its status and tell you what to do.\n\nIf a transfer can't be delivered (for example a closed account or an invalid number), our team contacts you to correct the details or process a refund, according to our terms of use.",
    },
  },
  {
    slug: "montant-minimum-maximum",
    category: "transfer",
    links: ["linkFees"],
    fr: {
      q: "Quel montant puis-je envoyer ?",
      a: "Depuis le Canada, chaque transfert peut aller de {min} à {max}. Ces limites sont indiquées dans le simulateur et sur la page des frais.\n\nPour des raisons de sécurité et de conformité, des vérifications supplémentaires peuvent être demandées selon les montants envoyés ou leur fréquence.",
    },
    en: {
      q: "How much can I send?",
      a: "From Canada, each transfer can be from {min} to {max}. These limits are shown in the simulator and on the fees page.\n\nFor security and compliance reasons, additional checks may be requested depending on the amounts sent or how often.",
    },
  },

  /* ------------------------------------------------------------------ */
  /* Paiements & frais                                                   */
  /* ------------------------------------------------------------------ */
  {
    slug: "calcul-des-frais",
    category: "payments",
    links: ["linkFees", "linkSimulator"],
    fr: {
      q: "Comment sont calculés les frais ?",
      a: "Les frais d'envoi comprennent une part fixe de {flat} et {percent} % du montant envoyé. Ils s'ajoutent au montant : votre proche reçoit l'intégralité du montant converti.\n\nExemple : pour 100 CAD, les frais sont la part fixe plus {percent} % de 100 CAD. Le détail exact, pour chaque destination, est sur la page « Frais, taux et délais ».",
    },
    en: {
      q: "How are fees calculated?",
      a: "Transfer fees are made of a fixed part of {flat} plus {percent}% of the amount sent. They're added on top: your recipient gets the full converted amount.\n\nExample: for 100 CAD, the fee is the fixed part plus {percent}% of 100 CAD. The exact breakdown for each destination is on the “Fees, rates and delivery times” page.",
    },
  },
  {
    slug: "taux-de-change",
    category: "payments",
    links: ["linkFees"],
    fr: {
      q: "Quel taux de change est appliqué ?",
      a: "Nous partons du taux du marché, auquel s'applique une marge de change de {margin} %. Le taux affiché dans le simulateur et dans l'application inclut déjà cette marge : il n'y a pas de frais de conversion en plus.\n\nLes taux évoluent en continu. Lorsque vous confirmez un devis dans l'application, le taux est garanti pendant sa durée de validité ({ttl} minutes) ; passé ce délai, un nouveau devis est calculé.",
    },
    en: {
      q: "Which exchange rate is applied?",
      a: "We start from the market rate and apply an exchange margin of {margin}%. The rate shown in the simulator and in the app already includes this margin: there's no extra conversion fee.\n\nRates change continuously. When you confirm a quote in the app, the rate is guaranteed for its validity period ({ttl} minutes); after that, a new quote is calculated.",
    },
  },
  {
    slug: "total-avant-paiement",
    category: "payments",
    links: ["linkSimulator"],
    fr: {
      q: "Que vois-je avant de payer ?",
      a: "Avant toute confirmation, un récapitulatif affiche :\n- le montant envoyé et les frais ;\n- le total qui sera débité ;\n- le taux de change appliqué ;\n- le montant exact que recevra votre proche, dans sa devise ;\n- le délai de réception estimé.\n\nRien n'est débité tant que vous n'avez pas confirmé ce récapitulatif.",
    },
    en: {
      q: "What do I see before paying?",
      a: "Before you confirm, a summary shows:\n- the amount sent and the fees;\n- the total that will be charged;\n- the exchange rate applied;\n- the exact amount your recipient will get, in their currency;\n- the estimated delivery time.\n\nNothing is charged until you confirm this summary.",
    },
  },
  {
    slug: "frais-supplementaires",
    category: "payments",
    links: ["linkFees"],
    fr: {
      q: "Y a-t-il d'autres frais que ceux affichés ?",
      a: "Du côté de PWFINTECH, non : les frais d'envoi et la marge de change incluse dans le taux sont les seuls coûts, et ils sont affichés avant le paiement.\n\nDes tiers peuvent toutefois appliquer leurs propres frais, que nous ne contrôlons pas, par exemple :\n- votre banque ou l'émetteur de votre carte (certaines cartes de crédit traitent un paiement comme une avance de fonds) ;\n- l'opérateur mobile money du destinataire, s'il retire ensuite l'argent en espèces.",
    },
    en: {
      q: "Are there other fees beyond those shown?",
      a: "Not from PWFINTECH: the transfer fee and the margin included in the rate are the only costs, and they're shown before payment.\n\nThird parties may however charge their own fees, which we don't control, for example:\n- your bank or card issuer (some credit cards treat a payment as a cash advance);\n- the recipient's mobile money operator, if they then withdraw the money as cash.",
    },
  },
  {
    slug: "moyens-de-paiement",
    category: "payments",
    links: ["linkApp"],
    fr: {
      q: "Comment puis-je payer mon transfert ?",
      a: "Le paiement se fait dans l'application WorldSoft Transfer, au moment de confirmer l'envoi. Il est traité par un prestataire de paiement spécialisé : PWFINTECH ne conserve pas le numéro complet de votre carte.\n\nLes moyens de paiement acceptés sont affichés dans l'application lors du paiement.",
    },
    en: {
      q: "How can I pay for my transfer?",
      a: "Payment happens in the WorldSoft Transfer app when you confirm the transfer. It's processed by a specialized payment provider: PWFINTECH doesn't store your full card number.\n\nThe accepted payment methods are shown in the app at checkout.",
    },
  },
  {
    slug: "paiement-refuse",
    category: "payments",
    links: ["linkContact"],
    fr: {
      q: "Mon paiement a été refusé : que faire ?",
      a: "Un refus vient le plus souvent de la banque ou de l'émetteur de la carte. Vérifiez :\n- les informations saisies (numéro, date d'expiration, code) ;\n- votre plafond de paiement en ligne ou à l'international ;\n- l'étape de validation demandée par votre banque (notification ou code).\n\nSi le problème persiste, contactez votre banque, puis écrivez-nous si besoin. Aucun transfert n'est envoyé tant que le paiement n'est pas confirmé.",
    },
    en: {
      q: "My payment was declined: what should I do?",
      a: "A decline usually comes from the bank or card issuer. Check:\n- the details entered (number, expiry date, code);\n- your online or international payment limit;\n- the verification step requested by your bank (notification or code).\n\nIf the problem continues, contact your bank, then write to us if needed. No transfer is sent until the payment is confirmed.",
    },
  },

  /* ------------------------------------------------------------------ */
  /* Compte & sécurité                                                   */
  /* ------------------------------------------------------------------ */
  {
    slug: "verification-identite",
    category: "account",
    links: ["linkPrivacy"],
    fr: {
      q: "Pourquoi dois-je vérifier mon identité ?",
      a: "Les entreprises de transfert d'argent doivent connaître leurs clients pour prévenir la fraude et le blanchiment d'argent. La vérification protège aussi votre compte et vos proches.\n\nElle se fait dans l'application, en général une seule fois, avec une pièce d'identité officielle valide. Selon les montants ou la situation, d'autres informations peuvent être demandées (par exemple une preuve d'adresse ou l'origine des fonds).",
    },
    en: {
      q: "Why do I need to verify my identity?",
      a: "Money transfer businesses must know their customers to prevent fraud and money laundering. Verification also protects your account and your loved ones.\n\nIt's done in the app, usually once, with a valid government-issued ID. Depending on amounts or circumstances, other information may be requested (for example proof of address or source of funds).",
    },
  },
  {
    slug: "proteger-mon-compte",
    category: "account",
    links: ["linkContact"],
    fr: {
      q: "Comment protéger mon compte ?",
      a: "Quelques réflexes simples :\n- utilisez un mot de passe unique et ne le communiquez à personne ;\n- ne partagez jamais un code reçu par texto ou courriel ;\n- verrouillez votre téléphone et gardez l'application à jour ;\n- méfiez-vous des messages qui vous pressent d'agir ou imitent PWFINTECH.\n\nPWFINTECH ne vous demandera jamais votre mot de passe ni un code de validation, que ce soit par téléphone, courriel ou message.",
    },
    en: {
      q: "How do I protect my account?",
      a: "A few simple habits:\n- use a unique password and never share it;\n- never share a code received by text or email;\n- lock your phone and keep the app up to date;\n- be wary of messages that rush you or imitate PWFINTECH.\n\nPWFINTECH will never ask for your password or a verification code, by phone, email or message.",
    },
  },
  {
    slug: "arnaques",
    category: "account",
    links: ["linkContact"],
    fr: {
      q: "Comment reconnaître une arnaque ?",
      a: "Ne transférez jamais d'argent à une personne que vous n'avez jamais rencontrée en personne. Méfiez-vous si l'on vous :\n- promet un gain, un prix, un emploi ou un prêt contre un paiement ;\n- demande de payer d'urgence une « amende », des frais de douane ou une facture ;\n- demande de garder le secret ou de mentir sur le motif du transfert ;\n- contacte au nom d'un proche avec un nouveau numéro.\n\nEn cas de doute, ne payez pas et contactez-nous. Un transfert livré peut être impossible à récupérer.",
    },
    en: {
      q: "How do I spot a scam?",
      a: "Never send money to someone you've never met in person. Be wary if someone:\n- promises a win, a prize, a job or a loan in exchange for a payment;\n- asks you to urgently pay a “fine”, customs fees or a bill;\n- asks you to keep it secret or lie about the reason for the transfer;\n- contacts you on behalf of a relative from a new number.\n\nIf in doubt, don't pay and contact us. A delivered transfer may be impossible to recover.",
    },
  },
  {
    slug: "donnees-personnelles",
    category: "account",
    links: ["linkPrivacy"],
    fr: {
      q: "Que faites-vous de mes données personnelles ?",
      a: "Nous recueillons uniquement les renseignements nécessaires aux services que vous utilisez (transferts, demandes de devis, rendez-vous, projets, liste d'attente) et nous ne les vendons pas.\n\nVous pouvez demander l'accès à vos renseignements, leur correction ou retirer votre consentement. La politique de confidentialité détaille ce que nous recueillons, pourquoi, et combien de temps nous le conservons.",
    },
    en: {
      q: "What do you do with my personal data?",
      a: "We only collect the information needed for the services you use (transfers, quote requests, appointments, projects, waitlist) and we don't sell it.\n\nYou can request access to your information, its correction, or withdraw your consent. The privacy policy details what we collect, why, and how long we keep it.",
    },
  },
  {
    slug: "suivre-ma-demande",
    category: "account",
    links: ["linkContact"],
    fr: {
      q: "J'ai envoyé une demande sur le site : comment la suivre ?",
      a: "Chaque demande envoyée depuis le site (message de contact, devis d'expédition, rendez-vous finances ou projet technologique) reçoit une référence affichée à l'écran, par exemple CT-…, SHQ-…, FIN-… ou TECH-….\n\nConservez-la : notre équipe vous répond à l'adresse courriel indiquée, et la référence nous permet de retrouver votre dossier immédiatement si vous nous recontactez.",
    },
    en: {
      q: "I sent a request on the website: how do I follow up?",
      a: "Every request sent from the website (contact message, shipping quote, finance appointment or technology project) gets a reference shown on screen, such as CT-…, SHQ-…, FIN-… or TECH-….\n\nKeep it: our team replies to the email address you provided, and the reference lets us find your file instantly if you contact us again.",
    },
  },

  /* ------------------------------------------------------------------ */
  /* Shipping                                                            */
  /* ------------------------------------------------------------------ */
  {
    slug: "devis-expedition",
    category: "shipping",
    links: ["linkShippingQuote", "linkShipping"],
    fr: {
      q: "Comment obtenir un devis d'expédition ?",
      a: "Les tarifs Shipping sont établis sur devis, car ils dépendent de chaque envoi. Remplissez le formulaire de demande de devis en indiquant :\n- l'origine et la destination ;\n- le mode (aérien ou maritime) ;\n- le poids, et si possible les dimensions ;\n- le contenu et sa valeur ;\n- si vous souhaitez un ramassage.\n\nVous recevez une référence immédiatement, et notre équipe vous répond avec un prix et un délai indicatif.",
    },
    en: {
      q: "How do I get a shipping quote?",
      a: "Shipping prices are quoted case by case, since they depend on each shipment. Fill in the quote request form with:\n- origin and destination;\n- mode (air or sea);\n- weight, and dimensions if possible;\n- contents and their value;\n- whether you'd like a pickup.\n\nYou get a reference right away, and our team replies with a price and an indicative transit time.",
    },
  },
  {
    slug: "suivi-de-colis",
    category: "shipping",
    links: ["linkShippingTrack"],
    fr: {
      q: "Comment suivre mon colis ?",
      a: "Lorsque votre envoi est pris en charge, vous recevez un numéro de suivi au format PWS-XXXXX. Saisissez-le sur la page « Suivi de colis » pour voir son statut : reçu, en transit, en douane, en livraison, livré.\n\nLa page publique n'affiche aucune donnée personnelle (ni nom, ni adresse). Si le statut indique un incident, contactez-nous avec votre numéro de suivi.",
    },
    en: {
      q: "How do I track my parcel?",
      a: "Once your shipment is accepted, you get a tracking number in the PWS-XXXXX format. Enter it on the “Parcel tracking” page to see its status: received, in transit, in customs, out for delivery, delivered.\n\nThe public page shows no personal data (no name or address). If the status shows an exception, contact us with your tracking number.",
    },
  },
  {
    slug: "articles-interdits",
    category: "shipping",
    links: ["linkShippingQuote", "linkTerms"],
    fr: {
      q: "Quels articles ne puis-je pas expédier ?",
      a: "Certains articles sont interdits ou réglementés par les transporteurs et les douanes, notamment :\n- matières dangereuses, inflammables ou explosives (aérosols, batteries non conformes…) ;\n- armes, munitions et répliques ;\n- drogues et certains médicaments ;\n- espèces, contrefaçons ;\n- denrées périssables ou produits soumis à des règles sanitaires.\n\nLes règles varient selon le pays de destination. Décrivez précisément le contenu dans votre demande de devis : nous vous confirmons ce qui peut être expédié.",
    },
    en: {
      q: "Which items can't I ship?",
      a: "Some items are prohibited or restricted by carriers and customs, including:\n- dangerous, flammable or explosive goods (aerosols, non-compliant batteries…);\n- weapons, ammunition and replicas;\n- drugs and some medicines;\n- cash, counterfeit goods;\n- perishables or products subject to health rules.\n\nRules vary by destination country. Describe the contents precisely in your quote request: we'll confirm what can be shipped.",
    },
  },
  {
    slug: "douane-et-taxes",
    category: "shipping",
    links: ["linkShipping"],
    fr: {
      q: "Qui paie les droits de douane ?",
      a: "Les droits et taxes à l'importation sont fixés par le pays de destination et restent généralement à la charge du destinataire, sauf accord contraire.\n\nNous vous aidons à préparer les documents (description du contenu, valeur déclarée) et à anticiper ces frais. Une déclaration exacte évite les retards et les pénalités en douane.",
    },
    en: {
      q: "Who pays customs duties?",
      a: "Import duties and taxes are set by the destination country and are generally paid by the recipient, unless otherwise agreed.\n\nWe help you prepare the documents (description of contents, declared value) and anticipate these costs. An accurate declaration avoids customs delays and penalties.",
    },
  },

  /* ------------------------------------------------------------------ */
  /* Finances                                                            */
  /* ------------------------------------------------------------------ */
  {
    slug: "rendez-vous-finances",
    category: "finances",
    links: ["linkFinanceAppt", "linkFinances"],
    fr: {
      q: "Comment prendre rendez-vous pour un accompagnement financier ?",
      a: "Choisissez un sujet, un format (vidéo, téléphone ou en personne) et un créneau disponible sur la page de prise de rendez-vous. Les créneaux sont proposés du lundi au vendredi, en heure de l'Est.\n\nVous recevez une référence de rendez-vous, et notre équipe vous confirme le rendez-vous par courriel.",
    },
    en: {
      q: "How do I book a financial guidance appointment?",
      a: "Pick a topic, a format (video, phone or in person) and an available slot on the booking page. Slots are offered Monday to Friday, Eastern Time.\n\nYou get an appointment reference, and our team confirms the appointment by email.",
    },
  },
  {
    slug: "conseil-financier-reglemente",
    category: "finances",
    links: ["linkFinances", "linkTerms"],
    fr: {
      q: "Vendez-vous des produits financiers ou gérez-vous mon argent ?",
      a: "Non. Notre accompagnement financier relève du conseil pratique et de l'éducation : budget, épargne, organisation, structuration d'un projet.\n\nNous ne vendons pas de produits de placement, ne gérons pas votre argent et ne fournissons pas de conseil en placement, fiscal ou juridique réglementé. Si votre situation l'exige, nous vous recommandons de consulter un professionnel autorisé.",
    },
    en: {
      q: "Do you sell financial products or manage my money?",
      a: "No. Our financial guidance is practical advice and education: budgeting, savings, organization, structuring a project.\n\nWe don't sell investment products, don't manage your money and don't provide regulated investment, tax or legal advice. If your situation calls for it, we recommend consulting a licensed professional.",
    },
  },

  /* ------------------------------------------------------------------ */
  /* Technologies                                                        */
  /* ------------------------------------------------------------------ */
  {
    slug: "projet-technologique",
    category: "tech",
    links: ["linkTechProject", "linkTech"],
    fr: {
      q: "Comment vous présenter un projet technologique ?",
      a: "Décrivez votre projet sur la page dédiée : type de projet (site web, application mobile, solution de paiement, conseil IT, maintenance…), description, budget envisagé et échéance.\n\nVous recevez une référence, puis nous organisons un premier échange. Une estimation détaillée (périmètre, étapes, délais et tarif) vous est remise avant tout engagement.",
    },
    en: {
      q: "How do I present a technology project?",
      a: "Describe your project on the dedicated page: project type (website, mobile app, payment solution, IT consulting, maintenance…), description, intended budget and timeline.\n\nYou get a reference, then we set up a first conversation. A detailed estimate (scope, milestones, timeline and price) is provided before any commitment.",
    },
  },
  {
    slug: "propriete-du-code",
    category: "tech",
    links: ["linkTech"],
    fr: {
      q: "Qui est propriétaire du code et des données de mon projet ?",
      a: "Les conditions de propriété sont précisées dans la proposition ou le contrat de chaque projet. Notre approche par défaut : vos données vous appartiennent et vous gardez la maîtrise de votre produit.\n\nNous pouvons aussi reprendre un projet existant : nous commençons alors par un audit pour évaluer son état et proposer la meilleure façon d'avancer.",
    },
    en: {
      q: "Who owns my project's code and data?",
      a: "Ownership terms are set out in each project's proposal or contract. Our default approach: your data belongs to you and you stay in control of your product.\n\nWe can also take over an existing project: we then start with an audit to assess it and suggest the best way forward.",
    },
  },

  /* ------------------------------------------------------------------ */
  /* Entreprise                                                          */
  /* ------------------------------------------------------------------ */
  {
    slug: "qui-est-pwfintech",
    category: "company",
    links: ["linkAbout"],
    fr: {
      q: "Qui est PWFINTECH ?",
      a: "PWFINTECH (Paul World Finances and Technologies) est une entreprise basée au Canada qui réunit quatre pôles : transfert d'argent avec l'application WorldSoft Transfer, accompagnement financier, technologies et shipping.\n\nNotre devise : « Plus qu'un service, une solution pour votre avenir. »",
    },
    en: {
      q: "Who is PWFINTECH?",
      a: "PWFINTECH (Paul World Finances and Technologies) is a Canada-based company with four business lines: money transfer with the WorldSoft Transfer app, financial guidance, technology and shipping.\n\nOur motto: “More than a service, a solution for your future.”",
    },
  },
  {
    slug: "conformite",
    category: "company",
    links: ["linkAbout", "linkTerms"],
    fr: {
      q: "PWFINTECH est-elle inscrite auprès des autorités ?",
      a: "Au Canada, les entreprises de services monétaires doivent être inscrites auprès du CANAFE (Centre d'analyse des opérations et déclarations financières du Canada) et respecter des obligations de connaissance des clients, de tenue de registres et de déclaration.\n\nPWFINTECH s'engage à respecter ces obligations. Numéro d'inscription CANAFE : {registration}. Toute inscription peut être vérifiée dans le registre public des entreprises de services monétaires du CANAFE.",
    },
    en: {
      q: "Is PWFINTECH registered with the authorities?",
      a: "In Canada, money services businesses must register with FINTRAC (Financial Transactions and Reports Analysis Centre of Canada) and meet know-your-customer, record-keeping and reporting obligations.\n\nPWFINTECH is committed to meeting these obligations. FINTRAC registration number: {registration}. Any registration can be checked in FINTRAC's public registry of money services businesses.",
    },
  },
  {
    slug: "contacter-equipe",
    category: "company",
    links: ["linkContact"],
    fr: {
      q: "Comment contacter l'équipe ?",
      a: "Le plus simple est le formulaire de la page Contact : choisissez le sujet (transfert, finances, technologies, shipping ou autre) et décrivez votre demande. Vous recevez une référence immédiatement.\n\nHoraires : {hours}. Nous répondons en français et en anglais. Pour un transfert, indiquez toujours sa référence.",
    },
    en: {
      q: "How do I contact the team?",
      a: "The easiest way is the Contact page form: choose the subject (transfer, finances, technologies, shipping or other) and describe your request. You get a reference right away.\n\nHours: {hours}. We answer in French and English. For a transfer, always include its reference.",
    },
  },
];

export function getHelpArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}
