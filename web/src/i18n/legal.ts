import { defineMessages } from "@/i18n/define";

/**
 * Pages légales. Chaque section : `sNt` (titre) et `sNb` (corps).
 * Dans le corps, les paragraphes sont séparés par une ligne vide et
 * les lignes commençant par « - » forment une liste à puces.
 * `{email}`, `{company}` et `{city}` sont remplacés à l'affichage.
 */

export const legalCommon = defineMessages({
  fr: {
    updated: "Dernière mise à jour : {date}",
    date: "1 octobre 2026",
    toc: "Sommaire",
    reviewTitle: "Document à valider",
    reviewText:
      "Ce document est fourni à titre informatif et doit être revu par un professionnel du droit avant d'être considéré comme définitif.",
    questions: "Une question sur ce document ?",
    contactUs: "Nous écrire",
    backToTop: "Retour en haut",
    seeAlso: "Voir aussi",
  },
  en: {
    updated: "Last updated: {date}",
    date: "October 1, 2026",
    toc: "Contents",
    reviewTitle: "Document under review",
    reviewText:
      "This document is provided for information purposes and must be reviewed by a legal professional before being considered final.",
    questions: "A question about this document?",
    contactUs: "Write to us",
    backToTop: "Back to top",
    seeAlso: "See also",
  },
  es: {
    updated: "Última actualización: {date}",
    date: "1 de octubre de 2026",
    toc: "Índice",
    contactUs: "Escríbanos",
    seeAlso: "Ver también",
  },
  zh: {
    updated: "最后更新：{date}",
    date: "2026年10月1日",
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
      "{company} (« PWFINTECH », « nous ») est une entreprise basée au Canada ({city}) qui propose des services de transfert d'argent, d'accompagnement financier, de technologies et de shipping.\n\nPour toute question relative à vos renseignements personnels, vous pouvez nous écrire à {email}.",
    s2t: "Renseignements que nous recueillons",
    s2b:
      "Nous recueillons uniquement les renseignements nécessaires aux services que vous utilisez :\n- Identification et contact : nom, adresse courriel, numéro de téléphone.\n- Compte : identifiants de connexion et préférences (par exemple la langue).\n- Transferts : montants, pays, coordonnées de vos bénéficiaires (nom, numéro mobile money ou coordonnées bancaires) et historique des opérations.\n- Vérification d'identité : pièces justificatives lorsque la réglementation l'exige.\n- Demandes de devis ou de contact : informations que vous nous communiquez volontairement.\n- Données techniques : informations de navigation de base nécessaires à la sécurité et au bon fonctionnement du site.",
    s3t: "Utilisation de vos renseignements",
    s3b:
      "Vos renseignements sont utilisés pour :\n- fournir, exécuter et suivre les services demandés ;\n- vous informer de l'état de vos transferts ou envois ;\n- prévenir la fraude et respecter nos obligations légales ;\n- répondre à vos questions et améliorer nos services.\n\nNous ne vendons pas vos renseignements personnels.",
    s4t: "Consentement",
    s4b:
      "En utilisant nos services, vous consentez à la collecte et à l'utilisation de vos renseignements aux fins décrites dans cette politique. Vous pouvez retirer votre consentement à tout moment, sous réserve des obligations légales ou contractuelles ; ce retrait peut toutefois nous empêcher de vous fournir certains services.",
    s5t: "Partage avec des tiers",
    s5b:
      "Nous ne partageons vos renseignements qu'avec les tiers nécessaires à la fourniture des services, par exemple :\n- les prestataires de paiement et opérateurs de mobile money ou bancaires qui exécutent les transferts ;\n- les transporteurs et intervenants logistiques pour les envois ;\n- nos fournisseurs techniques (hébergement, envoi de courriels) ;\n- les autorités, lorsque la loi l'exige.\n\nCes tiers ne reçoivent que les renseignements nécessaires à leur mission.",
    s6t: "Transferts hors du Canada",
    s6b:
      "Par nature, certains services (transferts d'argent, expéditions) impliquent de communiquer des renseignements à des partenaires situés hors du Canada. Ces renseignements peuvent alors être soumis aux lois du pays concerné. Nous prenons des mesures raisonnables pour qu'ils restent protégés.",
    s7t: "Conservation",
    s7b:
      "Nous conservons vos renseignements aussi longtemps que nécessaire aux fins pour lesquelles ils ont été recueillis, ou pendant la durée exigée par la loi (par exemple pour les registres d'opérations financières). Ils sont ensuite supprimés ou anonymisés de façon sécuritaire.",
    s8t: "Sécurité",
    s8b:
      "Nous mettons en œuvre des mesures de sécurité raisonnables, techniques et organisationnelles : chiffrement des échanges, contrôle des accès et surveillance. Aucun système n'étant infaillible, nous vous invitons aussi à protéger vos identifiants et à nous signaler toute activité suspecte.",
    s9t: "Vos droits",
    s9b:
      "Conformément aux lois canadiennes applicables en matière de protection des renseignements personnels, vous pouvez notamment :\n- demander l'accès aux renseignements que nous détenons à votre sujet ;\n- demander leur rectification s'ils sont inexacts ;\n- retirer votre consentement ;\n- déposer une plainte auprès de l'autorité de protection de la vie privée compétente.\n\nPour exercer vos droits, écrivez-nous à {email}.",
    s10t: "Témoins et stockage local",
    s10b:
      "Le site utilise des témoins (cookies) et le stockage local du navigateur uniquement lorsque c'est utile au service, par exemple pour maintenir votre session ou mémoriser votre langue. Vous pouvez les gérer depuis les réglages de votre navigateur.",
    s11t: "Modifications",
    s11b:
      "Nous pouvons mettre à jour cette politique pour refléter l'évolution de nos services ou de la réglementation. La date de dernière mise à jour figure en haut de cette page.",
    s12t: "Nous joindre",
    s12b:
      "Pour toute question ou demande concernant cette politique ou vos renseignements personnels, écrivez-nous à {email}.",
  },
  en: {
    eyebrow: "Legal",
    title: "Privacy policy",
    intro:
      "Protecting your personal information matters to us. This policy explains what information {company} collects, why, how it is protected and what your rights are.",
    s1t: "Who we are",
    s1b:
      "{company} (“PWFINTECH”, “we”) is a company based in Canada ({city}) offering money transfer, financial guidance, technology and shipping services.\n\nFor any question about your personal information, you can write to us at {email}.",
    s2t: "Information we collect",
    s2b:
      "We only collect the information needed for the services you use:\n- Identification and contact: name, email address, phone number.\n- Account: login credentials and preferences (such as language).\n- Transfers: amounts, countries, your recipients' details (name, mobile money number or bank details) and transaction history.\n- Identity verification: supporting documents when regulations require it.\n- Quote or contact requests: information you voluntarily provide.\n- Technical data: basic browsing information needed for security and for the site to work properly.",
    s3t: "How we use your information",
    s3b:
      "Your information is used to:\n- provide, perform and track the services you request;\n- keep you informed about the status of your transfers or shipments;\n- prevent fraud and meet our legal obligations;\n- answer your questions and improve our services.\n\nWe do not sell your personal information.",
    s4t: "Consent",
    s4b:
      "By using our services, you consent to the collection and use of your information for the purposes described in this policy. You may withdraw your consent at any time, subject to legal or contractual obligations; withdrawal may however prevent us from providing certain services.",
    s5t: "Sharing with third parties",
    s5b:
      "We only share your information with third parties needed to provide the services, for example:\n- payment providers and mobile money or banking operators that carry out transfers;\n- carriers and logistics providers for shipments;\n- our technical providers (hosting, email delivery);\n- authorities, when required by law.\n\nThese third parties only receive the information needed for their task.",
    s6t: "Transfers outside Canada",
    s6b:
      "By their nature, some services (money transfers, shipments) involve sharing information with partners located outside Canada. This information may then be subject to the laws of the country concerned. We take reasonable steps to keep it protected.",
    s7t: "Retention",
    s7b:
      "We keep your information for as long as needed for the purposes for which it was collected, or for the period required by law (for example for financial transaction records). It is then securely deleted or anonymized.",
    s8t: "Security",
    s8b:
      "We apply reasonable technical and organizational security measures: encrypted communications, access control and monitoring. As no system is infallible, we also encourage you to protect your credentials and report any suspicious activity to us.",
    s9t: "Your rights",
    s9b:
      "In accordance with applicable Canadian privacy laws, you may in particular:\n- request access to the information we hold about you;\n- request its correction if it is inaccurate;\n- withdraw your consent;\n- file a complaint with the competent privacy authority.\n\nTo exercise your rights, write to us at {email}.",
    s10t: "Cookies and local storage",
    s10b:
      "The site uses cookies and browser local storage only when useful to the service, for example to keep you signed in or remember your language. You can manage them in your browser settings.",
    s11t: "Changes",
    s11b:
      "We may update this policy to reflect changes in our services or regulations. The last updated date appears at the top of this page.",
    s12t: "Contact us",
    s12b: "For any question or request about this policy or your personal information, write to us at {email}.",
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
      "Avant chaque transfert, les frais, le taux de change et le montant reçu vous sont présentés pour confirmation.\n- Vous êtes responsable de l'exactitude des informations du bénéficiaire.\n- Les délais indiqués sont estimatifs et peuvent varier selon le pays, l'opérateur ou les vérifications nécessaires.\n- Nous pouvons demander des informations complémentaires, suspendre ou refuser un transfert pour des raisons de sécurité, de prévention de la fraude ou de conformité.\n- Une fois les fonds versés au bénéficiaire, un transfert ne peut généralement plus être annulé.",
    s5t: "Shipping",
    s5b:
      "Les devis sont établis à partir des informations fournies et peuvent être ajustés si le poids, les dimensions ou le contenu réels diffèrent.\n- Vous vous engagez à ne pas expédier d'articles interdits ou réglementés sans autorisation.\n- Les droits, taxes et frais de douane du pays de destination sont généralement à la charge du destinataire, sauf accord contraire.\n- Les délais de transport sont indicatifs et peuvent être affectés par des facteurs indépendants de notre volonté (transporteurs, douanes, météo).",
    s6t: "Finances et technologies",
    s6b:
      "Nos services d'accompagnement financier relèvent du conseil pratique et de l'éducation ; ils ne constituent pas un conseil en placement, fiscal ou juridique réglementé.\n\nLes projets technologiques font l'objet d'une proposition ou d'un contrat distinct précisant le périmètre, les délais, les tarifs et la propriété des livrables.",
    s7t: "Utilisation acceptable",
    s7b:
      "Vous vous engagez à ne pas utiliser nos services :\n- à des fins illégales, frauduleuses ou de blanchiment d'argent ;\n- pour porter atteinte aux droits de tiers ;\n- pour tenter de perturber, contourner ou compromettre la sécurité du site.\n\nTout manquement peut entraîner la suspension ou la fermeture du compte.",
    s8t: "Propriété intellectuelle",
    s8b:
      "Le nom PWFINTECH, le logo, les contenus et le design du site sont protégés. Toute reproduction ou utilisation sans autorisation écrite préalable est interdite.",
    s9t: "Responsabilité",
    s9b:
      "Nous mettons tout en œuvre pour fournir des services fiables. Dans la mesure permise par la loi, notre responsabilité est limitée aux dommages directs résultant d'un manquement de notre part, et nous ne saurions être tenus responsables des retards ou défaillances imputables à des tiers (opérateurs, banques, transporteurs, douanes) ou à des événements hors de notre contrôle.",
    s10t: "Droit applicable",
    s10b:
      "Ces conditions sont régies par les lois applicables au Canada et dans la province où {company} est établie. En cas de différend, nous privilégions toujours une solution amiable ; écrivez-nous d'abord à {email}.",
    s11t: "Nous joindre",
    s11b: "Pour toute question concernant ces conditions, écrivez-nous à {email}.",
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
      "Before each transfer, the fees, exchange rate and amount received are shown to you for confirmation.\n- You are responsible for the accuracy of the recipient's information.\n- Stated delivery times are estimates and may vary by country, operator or required checks.\n- We may request additional information, suspend or refuse a transfer for security, fraud prevention or compliance reasons.\n- Once funds have been paid out to the recipient, a transfer generally can no longer be cancelled.",
    s5t: "Shipping",
    s5b:
      "Quotes are based on the information provided and may be adjusted if the actual weight, dimensions or contents differ.\n- You agree not to ship prohibited or restricted items without authorization.\n- Duties, taxes and customs fees in the destination country are generally paid by the recipient, unless otherwise agreed.\n- Transit times are indicative and may be affected by factors beyond our control (carriers, customs, weather).",
    s6t: "Finances and technologies",
    s6b:
      "Our financial guidance services are practical advice and education; they do not constitute regulated investment, tax or legal advice.\n\nTechnology projects are covered by a separate proposal or contract specifying scope, timelines, pricing and ownership of deliverables.",
    s7t: "Acceptable use",
    s7b:
      "You agree not to use our services:\n- for illegal, fraudulent or money laundering purposes;\n- to infringe the rights of others;\n- to attempt to disrupt, bypass or compromise the security of the site.\n\nAny breach may lead to suspension or closure of the account.",
    s8t: "Intellectual property",
    s8b:
      "The PWFINTECH name, logo, content and site design are protected. Any reproduction or use without prior written permission is prohibited.",
    s9t: "Liability",
    s9b:
      "We do our best to provide reliable services. To the extent permitted by law, our liability is limited to direct damages resulting from a failure on our part, and we cannot be held responsible for delays or failures attributable to third parties (operators, banks, carriers, customs) or to events beyond our control.",
    s10t: "Governing law",
    s10b:
      "These terms are governed by the laws applicable in Canada and in the province where {company} is established. In case of a dispute, we always favour an amicable solution; please write to us first at {email}.",
    s11t: "Contact us",
    s11b: "For any question about these terms, write to us at {email}.",
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
