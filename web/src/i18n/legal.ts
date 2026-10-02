import { defineMessages } from "@/i18n/define";

/**
 * Pages légales. Chaque section : `sNt` (titre) et `sNb` (corps).
 * Dans le corps, les paragraphes sont séparés par une ligne vide et
 * les lignes commençant par « - » forment une liste à puces.
 * `{email}`, `{company}` et `{cityPart}` (« (Ville) » ou vide) sont remplacés à l'affichage.
 */

export const legalCommon = defineMessages({
  fr: {
    updated: "Dernière mise à jour : {date}",
    date: "2 octobre 2026",
    toc: "Sommaire",
    reviewTitle: "Document à faire valider par un juriste",
    reviewText:
      "Ce document est fourni à titre informatif. Il doit être revu et validé par un juriste avant d'être considéré comme définitif. Les informations marquées « à compléter » (raison sociale, adresse, numéro d'inscription CANAFE) seront ajoutées dès qu'elles seront disponibles.",
    emailFallback: "le formulaire de la page Contact",
    registration: "Inscription CANAFE : {n}",
    questions: "Une question sur ce document ?",
    contactUs: "Nous écrire",
    backToTop: "Retour en haut",
    seeAlso: "Voir aussi",
  },
  en: {
    updated: "Last updated: {date}",
    date: "October 2, 2026",
    toc: "Contents",
    reviewTitle: "Document to be validated by a lawyer",
    reviewText:
      "This document is provided for information purposes. It must be reviewed and validated by a lawyer before being considered final. Items marked “to be completed” (legal name, address, FINTRAC registration number) will be added as soon as they are available.",
    emailFallback: "the form on our Contact page",
    registration: "FINTRAC registration: {n}",
    questions: "A question about this document?",
    contactUs: "Write to us",
    backToTop: "Back to top",
    seeAlso: "See also",
  },
  es: {
    updated: "Última actualización: {date}",
    date: "2 de octubre de 2026",
    toc: "Índice",
    contactUs: "Escríbanos",
    seeAlso: "Ver también",
  },
  zh: {
    updated: "最后更新：{date}",
    date: "2026年10月2日",
    toc: "目录",
    contactUs: "联系我们",
    seeAlso: "另见",
  },
});

/* ========================================================================== */
/* Politique de confidentialité                                                */
/* ========================================================================== */

export const privacyDoc = defineMessages({
  fr: {
    eyebrow: "Légal",
    title: "Politique de confidentialité",
    intro:
      "La protection de vos renseignements personnels est essentielle pour nous. Cette politique explique quels renseignements {company} recueille, pourquoi, comment ils sont protégés et quels sont vos droits.",
    s1t: "Qui sommes-nous",
    s1b:
      "{company} (« PWFINTECH », « nous ») est une entreprise basée au Canada{cityPart} qui propose des services de transfert d'argent (notamment via l'application WorldSoft Transfer), d'accompagnement financier, de technologies et de shipping.\n\nPour toute question relative à vos renseignements personnels, vous pouvez nous contacter via {email}.",
    s2t: "Renseignements que nous recueillons",
    s2b:
      "Nous recueillons uniquement les renseignements nécessaires aux services que vous utilisez :\n- Identification et contact : nom, adresse courriel, numéro de téléphone.\n- Compte : identifiants de connexion et préférences (par exemple la langue).\n- Transferts : montants, pays, coordonnées de vos bénéficiaires (nom, numéro mobile money ou coordonnées bancaires) et historique des opérations.\n- Vérification d'identité : pièces justificatives lorsque la réglementation l'exige.\n- Application WorldSoft Transfer : les transferts sont effectués dans l'application mobile WorldSoft Transfer, une solution PWFINTECH, qui traite les renseignements ci-dessus.\n- Demandes de service envoyées depuis le site : messages de contact, demandes de devis d'expédition, demandes de rendez-vous (sujet, format, date et heure) et descriptions de projets technologiques, avec la référence attribuée.\n- Colis : informations nécessaires à l'expédition et au suivi (origine, destination, poids, contenu, valeur déclarée, adresse de livraison) et historique des étapes.\n- Liste d'attente de l'application : adresse courriel, pays de destination envisagé (facultatif), langue et date de votre consentement.\n- Données techniques : informations de navigation de base nécessaires à la sécurité et au bon fonctionnement du site.",
    s3t: "Demandes de service, rendez-vous, colis et liste d'attente",
    s3b:
      "Lorsque vous envoyez une demande depuis le site (contact, devis d'expédition, rendez-vous finances, projet technologique), elle est enregistrée dans notre base de données avec une référence, puis traitée par notre équipe dans un espace d'administration protégé dont l'accès est réservé aux personnes autorisées.\n- Ces renseignements servent uniquement à répondre à votre demande, à organiser le rendez-vous, à établir le devis ou la proposition, et à en assurer le suivi.\n- Le suivi public d'un colis (numéro PWS-…) n'affiche aucune donnée nominative : ni nom, ni adresse, ni coordonnées.\n- Le statut d'une demande n'est consultable qu'avec sa référence et l'adresse courriel utilisée.\n- L'adresse inscrite sur la liste d'attente sert uniquement à vous prévenir du lancement de WorldSoft Transfer ; vous pouvez vous désinscrire à tout moment.\n\nUn mécanisme anti-robots et une limite du nombre de demandes protègent ces formulaires contre les abus.",
    s4t: "Utilisation de vos renseignements",
    s4b:
      "Vos renseignements sont utilisés pour :\n- fournir, exécuter et suivre les services demandés ;\n- vous informer de l'état de vos transferts, envois, demandes et rendez-vous ;\n- prévenir la fraude et respecter nos obligations légales ;\n- répondre à vos questions et améliorer nos services.\n\nNous ne vendons pas vos renseignements personnels.",
    s5t: "Consentement",
    s5b:
      "En utilisant nos services, vous consentez à la collecte et à l'utilisation de vos renseignements aux fins décrites dans cette politique. Vous pouvez retirer votre consentement à tout moment, sous réserve des obligations légales ou contractuelles ; ce retrait peut toutefois nous empêcher de vous fournir certains services.",
    s6t: "Partage avec des tiers",
    s6b:
      "Nous ne partageons vos renseignements qu'avec les tiers nécessaires à la fourniture des services, par exemple :\n- les prestataires de paiement et opérateurs de mobile money ou bancaires qui exécutent les transferts ;\n- les transporteurs et intervenants logistiques pour les envois ;\n- nos fournisseurs techniques (hébergement, base de données, envoi de courriels, prestataire de paiement) ;\n- les autorités, lorsque la loi l'exige.\n\nCes tiers ne reçoivent que les renseignements nécessaires à leur mission.",
    s7t: "Transferts hors du Canada",
    s7b:
      "Par nature, certains services (transferts d'argent, expéditions) impliquent de communiquer des renseignements à des partenaires situés hors du Canada. Ces renseignements peuvent alors être soumis aux lois du pays concerné. Nous prenons des mesures raisonnables pour qu'ils restent protégés.",
    s8t: "Conservation",
    s8b:
      "Nous conservons vos renseignements aussi longtemps que nécessaire aux fins pour lesquelles ils ont été recueillis, ou pendant la durée exigée par la loi (par exemple pour les registres d'opérations financières). Les demandes de service closes et les inscriptions à la liste d'attente ne sont pas conservées plus longtemps qu'utile. Ils sont ensuite supprimés ou anonymisés de façon sécuritaire.",
    s9t: "Sécurité",
    s9b:
      "Nous mettons en œuvre des mesures de sécurité raisonnables, techniques et organisationnelles : chiffrement des échanges, contrôle des accès et surveillance. Aucun système n'étant infaillible, nous vous invitons aussi à protéger vos identifiants et à nous signaler toute activité suspecte.",
    s10t: "Vos droits",
    s10b:
      "Conformément aux lois canadiennes applicables en matière de protection des renseignements personnels, vous pouvez notamment :\n- demander l'accès aux renseignements que nous détenons à votre sujet ;\n- demander leur rectification s'ils sont inexacts ;\n- retirer votre consentement ;\n- déposer une plainte auprès de l'autorité de protection de la vie privée compétente.\n\nPour exercer vos droits, contactez-nous via {email}.",
    s11t: "Témoins et stockage local",
    s11b:
      "Le site utilise des témoins (cookies) et le stockage local du navigateur uniquement lorsque c'est utile au service, par exemple pour maintenir votre session ou mémoriser votre langue. Vous pouvez les gérer depuis les réglages de votre navigateur.",
    s12t: "Modifications",
    s12b:
      "Nous pouvons mettre à jour cette politique pour refléter l'évolution de nos services ou de la réglementation. La date de dernière mise à jour figure en haut de cette page.",
    s13t: "Nous joindre",
    s13b:
      "Pour toute question ou demande concernant cette politique ou vos renseignements personnels, contactez-nous via {email}.",
  },
  en: {
    eyebrow: "Legal",
    title: "Privacy policy",
    intro:
      "Protecting your personal information matters to us. This policy explains what information {company} collects, why, how it is protected and what your rights are.",
    s1t: "Who we are",
    s1b:
      "{company} (“PWFINTECH”, “we”) is a company based in Canada{cityPart} offering money transfer (including through the WorldSoft Transfer app), financial guidance, technology and shipping services.\n\nFor any question about your personal information, you can contact us via {email}.",
    s2t: "Information we collect",
    s2b:
      "We only collect the information needed for the services you use:\n- Identification and contact: name, email address, phone number.\n- Account: login credentials and preferences (such as language).\n- Transfers: amounts, countries, your recipients' details (name, mobile money number or bank details) and transaction history.\n- Identity verification: supporting documents when regulations require it.\n- WorldSoft Transfer app: transfers are carried out in the WorldSoft Transfer mobile app, a PWFINTECH solution, which processes the information above.\n- Service requests sent from the website: contact messages, shipping quote requests, appointment requests (topic, format, date and time) and technology project descriptions, with the reference assigned.\n- Parcels: information needed for shipping and tracking (origin, destination, weight, contents, declared value, delivery address) and the history of tracking steps.\n- App waitlist: email address, intended destination country (optional), language and the date of your consent.\n- Technical data: basic browsing information needed for security and for the site to work properly.",
    s3t: "Service requests, appointments, parcels and waitlist",
    s3b:
      "When you send a request from the website (contact, shipping quote, finance appointment, technology project), it is stored in our database with a reference, then handled by our team in a protected administration area restricted to authorized people.\n- This information is only used to answer your request, organize the appointment, prepare the quote or proposal, and follow up.\n- Public parcel tracking (PWS-… number) shows no personal data: no name, address or contact details.\n- A request's status can only be viewed with its reference and the email address used.\n- The email address on the waitlist is only used to tell you when WorldSoft Transfer launches; you can unsubscribe at any time.\n\nAn anti-bot mechanism and a limit on the number of requests protect these forms from abuse.",
    s4t: "How we use your information",
    s4b:
      "Your information is used to:\n- provide, perform and track the services you request;\n- keep you informed about the status of your transfers, shipments, requests and appointments;\n- prevent fraud and meet our legal obligations;\n- answer your questions and improve our services.\n\nWe do not sell your personal information.",
    s5t: "Consent",
    s5b:
      "By using our services, you consent to the collection and use of your information for the purposes described in this policy. You may withdraw your consent at any time, subject to legal or contractual obligations; withdrawal may however prevent us from providing certain services.",
    s6t: "Sharing with third parties",
    s6b:
      "We only share your information with third parties needed to provide the services, for example:\n- payment providers and mobile money or banking operators that carry out transfers;\n- carriers and logistics providers for shipments;\n- our technical providers (hosting, database, email delivery, payment provider);\n- authorities, when required by law.\n\nThese third parties only receive the information needed for their task.",
    s7t: "Transfers outside Canada",
    s7b:
      "By their nature, some services (money transfers, shipments) involve sharing information with partners located outside Canada. This information may then be subject to the laws of the country concerned. We take reasonable steps to keep it protected.",
    s8t: "Retention",
    s8b:
      "We keep your information for as long as needed for the purposes for which it was collected, or for the period required by law (for example for financial transaction records). Closed service requests and waitlist sign-ups are not kept longer than useful. It is then securely deleted or anonymized.",
    s9t: "Security",
    s9b:
      "We apply reasonable technical and organizational security measures: encrypted communications, access control and monitoring. As no system is infallible, we also encourage you to protect your credentials and report any suspicious activity to us.",
    s10t: "Your rights",
    s10b:
      "In accordance with applicable Canadian privacy laws, you may in particular:\n- request access to the information we hold about you;\n- request its correction if it is inaccurate;\n- withdraw your consent;\n- file a complaint with the competent privacy authority.\n\nTo exercise your rights, contact us via {email}.",
    s11t: "Cookies and local storage",
    s11b:
      "The site uses cookies and browser local storage only when useful to the service, for example to keep you signed in or remember your language. You can manage them in your browser settings.",
    s12t: "Changes",
    s12b:
      "We may update this policy to reflect changes in our services or regulations. The last updated date appears at the top of this page.",
    s13t: "Contact us",
    s13b: "For any question or request about this policy or your personal information, contact us via {email}.",
  },
  es: {
    eyebrow: "Legal",
    title: "Política de privacidad",
  },
  zh: {
    eyebrow: "法律",
    title: "隐私政策",
  },
});

/* ========================================================================== */
/* Conditions d'utilisation                                                    */
/* ========================================================================== */

export const termsDoc = defineMessages({
  fr: {
    eyebrow: "Légal",
    title: "Conditions d'utilisation",
    intro:
      "Les présentes conditions encadrent l'utilisation du site et des services de {company}. Merci de les lire attentivement : en utilisant nos services, vous les acceptez.",
    s1t: "Objet",
    s1b:
      "Ces conditions définissent les règles d'accès et d'utilisation du site et des services proposés par {company} (« PWFINTECH », « nous ») : transfert d'argent, accompagnement financier, technologies et shipping.",
    s2t: "Acceptation et modifications",
    s2b:
      "En créant un compte ou en utilisant nos services, vous acceptez ces conditions. Nous pouvons les modifier pour tenir compte de l'évolution de nos services ou de la réglementation ; la version en vigueur est celle publiée sur cette page, avec sa date de mise à jour.",
    s3t: "Votre compte",
    s3b:
      "Pour utiliser certains services, vous devez créer un compte et fournir des informations exactes et à jour. Vous êtes responsable de la confidentialité de vos identifiants et de toute activité réalisée depuis votre compte. Prévenez-nous sans délai en cas d'utilisation non autorisée.",
    s4t: "Transfert d'argent",
    s4b:
      "Les transferts d'argent sont effectués dans l'application mobile WorldSoft Transfer, une solution PWFINTECH ; le site permet de les simuler. Avant chaque transfert, les frais, le taux de change et le montant reçu vous sont présentés pour confirmation.\n- Vous êtes responsable de l'exactitude des informations du bénéficiaire.\n- Les délais indiqués sont estimatifs et peuvent varier selon le pays, l'opérateur ou les vérifications nécessaires.\n- Nous pouvons demander des informations complémentaires, suspendre ou refuser un transfert pour des raisons de sécurité, de prévention de la fraude ou de conformité.\n- Une fois les fonds versés au bénéficiaire, un transfert ne peut généralement plus être annulé.",
    s5t: "Frais, taux de change et délais",
    s5b:
      "Les frais de transfert comprennent une part fixe et un pourcentage du montant envoyé, selon la devise d'envoi. Le taux de change appliqué correspond au taux du marché diminué d'une marge de change, déjà incluse dans le taux affiché.\n- Le montant envoyé, les frais, le total à payer, le taux appliqué, le montant reçu et le délai estimé sont affichés avant toute confirmation.\n- Les taux et montants présentés sur le site (page « Frais, taux et délais », fiches pays, simulateur) sont indicatifs ; seuls ceux confirmés dans l'application au moment du paiement font foi, pendant la durée de validité du devis.\n- Les montants minimum et maximum par transfert sont indiqués dans le simulateur.\n- Des tiers (votre banque, l'émetteur de votre carte, l'opérateur du destinataire) peuvent appliquer leurs propres frais, indépendants de notre volonté.\n- Les délais sont des estimations et peuvent varier selon le mode de réception, l'opérateur, les jours fériés ou les vérifications nécessaires.",
    s6t: "Demandes en ligne",
    s6b:
      "Les demandes envoyées depuis le site (contact, devis d'expédition, rendez-vous, projet technologique) reçoivent une référence. Une demande ne vaut pas contrat : un devis d'expédition, un rendez-vous ou une proposition de projet n'est ferme qu'après confirmation par notre équipe.\n\nLes tarifs Shipping, Finances et Technologies sont établis sur devis.",
    s7t: "Shipping",
    s7b:
      "Les devis sont établis à partir des informations fournies et peuvent être ajustés si le poids, les dimensions ou le contenu réels diffèrent.\n- Vous vous engagez à ne pas expédier d'articles interdits ou réglementés sans autorisation.\n- Les droits, taxes et frais de douane du pays de destination sont généralement à la charge du destinataire, sauf accord contraire.\n- Les délais de transport sont indicatifs et peuvent être affectés par des facteurs indépendants de notre volonté (transporteurs, douanes, météo).",
    s8t: "Finances et technologies",
    s8b:
      "Nos services d'accompagnement financier relèvent du conseil pratique et de l'éducation ; ils ne constituent pas un conseil en placement, fiscal ou juridique réglementé.\n\nLes projets technologiques font l'objet d'une proposition ou d'un contrat distinct précisant le périmètre, les délais, les tarifs et la propriété des livrables.",
    s9t: "Utilisation acceptable",
    s9b:
      "Vous vous engagez à ne pas utiliser nos services :\n- à des fins illégales, frauduleuses ou de blanchiment d'argent ;\n- pour porter atteinte aux droits de tiers ;\n- pour tenter de perturber, contourner ou compromettre la sécurité du site.\n\nTout manquement peut entraîner la suspension ou la fermeture du compte.",
    s10t: "Propriété intellectuelle",
    s10b:
      "Les noms PWFINTECH et WorldSoft Transfer, les logos, les contenus et le design du site sont protégés. Toute reproduction ou utilisation sans autorisation écrite préalable est interdite.",
    s11t: "Responsabilité",
    s11b:
      "Nous mettons tout en œuvre pour fournir des services fiables. Dans la mesure permise par la loi, notre responsabilité est limitée aux dommages directs résultant d'un manquement de notre part, et nous ne saurions être tenus responsables des retards ou défaillances imputables à des tiers (opérateurs, banques, transporteurs, douanes) ou à des événements hors de notre contrôle.",
    s12t: "Droit applicable",
    s12b:
      "Ces conditions sont régies par les lois applicables au Canada et dans la province où {company} est établie. En cas de différend, nous privilégions toujours une solution amiable ; contactez-nous d'abord via {email}.",
    s13t: "Nous joindre",
    s13b: "Pour toute question concernant ces conditions, contactez-nous via {email}.",
  },
  en: {
    eyebrow: "Legal",
    title: "Terms of use",
    intro:
      "These terms govern the use of the {company} website and services. Please read them carefully: by using our services, you accept them.",
    s1t: "Purpose",
    s1b:
      "These terms set out the rules for accessing and using the website and services offered by {company} (“PWFINTECH”, “we”): money transfer, financial guidance, technology and shipping.",
    s2t: "Acceptance and changes",
    s2b:
      "By creating an account or using our services, you accept these terms. We may change them to reflect changes in our services or regulations; the version in force is the one published on this page, with its update date.",
    s3t: "Your account",
    s3b:
      "To use some services, you must create an account and provide accurate, up-to-date information. You are responsible for keeping your credentials confidential and for any activity carried out from your account. Notify us immediately of any unauthorized use.",
    s4t: "Money transfer",
    s4b:
      "Money transfers are carried out in the WorldSoft Transfer mobile app, a PWFINTECH solution; the website lets you simulate them. Before each transfer, the fees, exchange rate and amount received are shown to you for confirmation.\n- You are responsible for the accuracy of the recipient's information.\n- Stated delivery times are estimates and may vary by country, operator or required checks.\n- We may request additional information, suspend or refuse a transfer for security, fraud prevention or compliance reasons.\n- Once funds have been paid out to the recipient, a transfer generally can no longer be cancelled.",
    s5t: "Fees, exchange rates and delivery times",
    s5b:
      "Transfer fees consist of a fixed part and a percentage of the amount sent, depending on the sending currency. The exchange rate applied is the market rate minus an exchange margin, already included in the rate shown.\n- The amount sent, fees, total to pay, rate applied, amount received and estimated delivery time are shown before any confirmation.\n- The rates and amounts shown on the website (“Fees, rates and delivery times” page, country pages, simulator) are indicative; only those confirmed in the app at payment time are binding, for the validity period of the quote.\n- Minimum and maximum amounts per transfer are shown in the simulator.\n- Third parties (your bank, your card issuer, the recipient's operator) may charge their own fees, beyond our control.\n- Delivery times are estimates and may vary with the payout method, operator, public holidays or required checks.",
    s6t: "Online requests",
    s6b:
      "Requests sent from the website (contact, shipping quote, appointment, technology project) receive a reference. A request is not a contract: a shipping quote, appointment or project proposal is only firm once confirmed by our team.\n\nShipping, Finances and Technologies prices are quoted case by case.",
    s7t: "Shipping",
    s7b:
      "Quotes are based on the information provided and may be adjusted if the actual weight, dimensions or contents differ.\n- You agree not to ship prohibited or restricted items without authorization.\n- Duties, taxes and customs fees in the destination country are generally paid by the recipient, unless otherwise agreed.\n- Transit times are indicative and may be affected by factors beyond our control (carriers, customs, weather).",
    s8t: "Finances and technologies",
    s8b:
      "Our financial guidance services are practical advice and education; they do not constitute regulated investment, tax or legal advice.\n\nTechnology projects are covered by a separate proposal or contract specifying scope, timelines, pricing and ownership of deliverables.",
    s9t: "Acceptable use",
    s9b:
      "You agree not to use our services:\n- for illegal, fraudulent or money laundering purposes;\n- to infringe the rights of others;\n- to attempt to disrupt, bypass or compromise the security of the site.\n\nAny breach may lead to suspension or closure of the account.",
    s10t: "Intellectual property",
    s10b:
      "The PWFINTECH and WorldSoft Transfer names, logos, content and site design are protected. Any reproduction or use without prior written permission is prohibited.",
    s11t: "Liability",
    s11b:
      "We do our best to provide reliable services. To the extent permitted by law, our liability is limited to direct damages resulting from a failure on our part, and we cannot be held responsible for delays or failures attributable to third parties (operators, banks, carriers, customs) or to events beyond our control.",
    s12t: "Governing law",
    s12b:
      "These terms are governed by the laws applicable in Canada and in the province where {company} is established. In case of a dispute, we always favour an amicable solution; please contact us first via {email}.",
    s13t: "Contact us",
    s13b: "For any question about these terms, contact us via {email}.",
  },
  es: {
    eyebrow: "Legal",
    title: "Términos de uso",
  },
  zh: {
    eyebrow: "法律",
    title: "使用条款",
  },
});
