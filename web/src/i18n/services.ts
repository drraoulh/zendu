import { defineMessages } from "@/i18n/define";

/** Libellés partagés par les pages marketing (services, entreprise). */
export const marketing = defineMessages({
  fr: {
    faqEyebrow: "Questions fréquentes",
    faqTitle: "Vos questions, nos réponses",
    faqSubtitle: "Vous ne trouvez pas votre réponse ? Écrivez-nous, nous vous répondrons avec plaisir.",
    contactUs: "Nous contacter",
    forWhoEyebrow: "Pour qui ?",
    commitmentsEyebrow: "Nos engagements",
    howEyebrow: "Comment ça marche",
    offerEyebrow: "Ce que nous proposons",
  },
  en: {
    faqEyebrow: "FAQ",
    faqTitle: "Your questions, answered",
    faqSubtitle: "Can't find what you're looking for? Write to us, we'll be happy to help.",
    contactUs: "Contact us",
    forWhoEyebrow: "Who is it for?",
    commitmentsEyebrow: "Our commitments",
    howEyebrow: "How it works",
    offerEyebrow: "What we offer",
  },
  es: {
    faqEyebrow: "Preguntas frecuentes",
    faqTitle: "Sus preguntas, nuestras respuestas",
    contactUs: "Contáctenos",
    forWhoEyebrow: "¿Para quién?",
    commitmentsEyebrow: "Nuestros compromisos",
    howEyebrow: "Cómo funciona",
    offerEyebrow: "Lo que ofrecemos",
  },
  zh: {
    faqEyebrow: "常见问题",
    faqTitle: "您的问题，我们来解答",
    contactUs: "联系我们",
    forWhoEyebrow: "适用人群",
    commitmentsEyebrow: "我们的承诺",
    howEyebrow: "如何运作",
    offerEyebrow: "我们的服务",
  },
});

/* ========================================================================== */
/* Transfert d'argent                                                          */
/* ========================================================================== */

export const transferPage = defineMessages({
  fr: {
    heroEyebrow: "Transfert d'argent",
    heroTitle: "Envoyez de l'argent du Canada vers l'Afrique et le monde",
    heroSubtitle:
      "Mobile money MTN et Orange, virement bancaire ou retrait selon le pays : vos proches reçoivent les fonds simplement, avec des frais affichés avant de confirmer.",
    heroCta: "Envoyer de l'argent",
    heroCta2: "Voir les destinations",
    hl1: "Frais et taux affichés à l'avance",
    hl2: "Mobile money et banque",
    hl3: "Suivi de chaque transfert",

    calcEyebrow: "Simulateur",
    calcTitle: "Calculez votre envoi en quelques secondes",
    calcSubtitle:
      "Indiquez un montant pour voir les frais, le taux appliqué et la somme que recevra votre proche. Le montant définitif vous est toujours présenté avant le paiement.",
    calcPoint1: "Montant reçu affiché dans la devise locale",
    calcPoint2: "Frais connus avant de payer",
    calcPoint3: "Récapitulatif complet avant confirmation",

    offerTitle: "Plusieurs façons de recevoir, une seule plateforme",
    offerSubtitle: "Choisissez le mode de réception le plus pratique pour votre bénéficiaire.",
    offer1Title: "Mobile money",
    offer1Text:
      "Envoi direct vers les portefeuilles MTN Mobile Money, Orange Money et d'autres réseaux disponibles selon le pays de destination.",
    offer2Title: "Virement bancaire",
    offer2Text:
      "Versement sur le compte bancaire du bénéficiaire lorsque cette option est proposée pour le pays choisi.",
    offer3Title: "Retrait en espèces",
    offer3Text:
      "Dans certains pays, votre proche peut retirer les fonds en espèces. Les options disponibles sont indiquées lors de l'envoi.",
    offer4Title: "Suivi à chaque étape",
    offer4Text:
      "Chaque transfert possède une référence unique et un statut que vous consultez à tout moment dans « Mes transferts ».",
    offer5Title: "Reçu détaillé",
    offer5Text: "Un reçu récapitule le montant envoyé, les frais, le taux de change et le montant reçu.",
    offer6Title: "Paiement protégé",
    offer6Text:
      "Vos informations sont transmises de façon chiffrée et chaque transfert est vérifié avant d'être envoyé.",

    howTitle: "Envoyer de l'argent en 4 étapes",
    howSubtitle: "Un parcours simple, pensé pour être clair du début à la fin.",
    step1Title: "Créez votre compte",
    step1Text: "Inscrivez-vous en quelques minutes avec votre adresse courriel.",
    step2Title: "Choisissez le pays et le montant",
    step2Text: "Le simulateur affiche immédiatement les frais, le taux et le montant reçu.",
    step3Title: "Ajoutez votre bénéficiaire",
    step3Text: "Nom et numéro mobile money ou coordonnées bancaires, selon le mode choisi.",
    step4Title: "Payez et suivez",
    step4Text: "Confirmez le paiement, puis suivez l'avancement de votre transfert en ligne.",

    destEyebrow: "Destinations",
    destTitle: "Où pouvez-vous envoyer ?",
    destSubtitle:
      "Un aperçu des pays desservis depuis le Canada. Les modes de réception disponibles varient selon le pays.",
    destModes: "{n} modes de réception",
    destMode: "1 mode de réception",
    destSend: "Envoyer",
    destAll: "Commencer un transfert",

    whoTitle: "Pensé pour la diaspora et ceux qui comptent sur elle",
    whoSubtitle:
      "Que ce soit pour soutenir la famille, régler une dépense importante ou faire face à une urgence, nous vous aidons à envoyer simplement.",
    who1: "Les familles de la diaspora qui soutiennent leurs proches au pays",
    who2: "Les étudiants et travailleurs installés au Canada",
    who3: "Les personnes qui règlent des frais de scolarité, de santé ou des factures pour un proche",
    who4: "Les entrepreneurs qui ont de petites dépenses à régler à l'étranger",

    comTitle: "La confiance se construit à chaque transfert",
    comSubtitle: "Nos engagements envers vous et vos proches.",
    com1Title: "Transparence",
    com1Text: "Les frais et le taux de change sont affichés avant toute confirmation. Pas de mauvaise surprise.",
    com2Title: "Sécurité",
    com2Text: "Données chiffrées, vérifications avant envoi et accès protégé à votre compte.",
    com3Title: "Accompagnement humain",
    com3Text: "Une équipe joignable en français et en anglais pour répondre à vos questions.",
    com4Title: "Conformité",
    com4Text:
      "Nous vérifions l'identité de nos clients lorsque la réglementation l'exige, pour protéger chacun contre la fraude.",

    faq1Q: "Combien de temps prend un transfert ?",
    faq1A:
      "Les envois vers un portefeuille mobile money sont généralement traités rapidement après la confirmation du paiement. Les virements bancaires peuvent prendre davantage de temps selon la banque du bénéficiaire. Le délai estimé vous est indiqué avant de confirmer.",
    faq2Q: "Quels sont les frais ?",
    faq2A:
      "Les frais et le taux de change dépendent du pays et du montant. Ils sont affichés dans le simulateur et récapitulés avant le paiement : vous savez exactement ce que vous payez et ce que votre proche reçoit.",
    faq3Q: "De quoi ai-je besoin pour envoyer de l'argent ?",
    faq3A:
      "Un compte PWFINTECH, un moyen de paiement et les coordonnées de votre bénéficiaire (nom complet, numéro mobile money ou coordonnées bancaires). Une pièce d'identité peut vous être demandée selon le montant ou la réglementation.",
    faq4Q: "Comment suivre mon transfert ?",
    faq4A:
      "Rendez-vous dans « Mes transferts » : chaque envoi y affiche sa référence, son statut et son reçu. Gardez la référence à portée de main si vous nous contactez.",
    faq5Q: "Je me suis trompé de numéro, que faire ?",
    faq5A:
      "Contactez-nous au plus vite en indiquant la référence du transfert. Si les fonds n'ont pas encore été versés, nous ferons notre possible pour corriger ou annuler l'envoi.",

    ctaTitle: "Prêt à envoyer votre premier transfert ?",
    ctaText: "Créez votre compte en quelques minutes et voyez exactement ce que votre proche recevra.",
  },
  en: {
    heroEyebrow: "Money transfer",
    heroTitle: "Send money from Canada to Africa and the world",
    heroSubtitle:
      "MTN and Orange mobile money, bank transfer or cash pickup depending on the country: your loved ones receive funds easily, with fees shown before you confirm.",
    heroCta: "Send money",
    heroCta2: "See destinations",
    hl1: "Fees and rates shown upfront",
    hl2: "Mobile money and bank",
    hl3: "Track every transfer",

    calcEyebrow: "Calculator",
    calcTitle: "Estimate your transfer in seconds",
    calcSubtitle:
      "Enter an amount to see the fees, the exchange rate and what your recipient will get. The final amount is always shown to you before payment.",
    calcPoint1: "Amount received shown in local currency",
    calcPoint2: "Fees known before you pay",
    calcPoint3: "Full summary before confirmation",

    offerTitle: "Several ways to receive, one platform",
    offerSubtitle: "Pick the most convenient payout method for your recipient.",
    offer1Title: "Mobile money",
    offer1Text:
      "Direct delivery to MTN Mobile Money, Orange Money and other networks available in the destination country.",
    offer2Title: "Bank transfer",
    offer2Text: "Payout to the recipient's bank account when this option is available for the chosen country.",
    offer3Title: "Cash pickup",
    offer3Text:
      "In some countries, your recipient can collect the funds in cash. Available options are shown when you send.",
    offer4Title: "Tracking at every step",
    offer4Text:
      "Each transfer has a unique reference and a status you can check anytime in “My transfers”.",
    offer5Title: "Detailed receipt",
    offer5Text: "A receipt sums up the amount sent, the fees, the exchange rate and the amount received.",
    offer6Title: "Protected payment",
    offer6Text: "Your information is encrypted in transit and every transfer is checked before it is sent.",

    howTitle: "Send money in 4 steps",
    howSubtitle: "A simple flow, designed to be clear from start to finish.",
    step1Title: "Create your account",
    step1Text: "Sign up in a few minutes with your email address.",
    step2Title: "Choose country and amount",
    step2Text: "The calculator instantly shows the fees, the rate and the amount received.",
    step3Title: "Add your recipient",
    step3Text: "Name and mobile money number or bank details, depending on the method.",
    step4Title: "Pay and track",
    step4Text: "Confirm the payment, then follow your transfer's progress online.",

    destEyebrow: "Destinations",
    destTitle: "Where can you send?",
    destSubtitle: "An overview of the countries served from Canada. Available payout methods vary by country.",
    destModes: "{n} payout methods",
    destMode: "1 payout method",
    destSend: "Send",
    destAll: "Start a transfer",

    whoTitle: "Built for the diaspora and the people who count on them",
    whoSubtitle:
      "Whether it's supporting family, covering an important expense or handling an emergency, we help you send simply.",
    who1: "Diaspora families supporting loved ones back home",
    who2: "Students and workers settled in Canada",
    who3: "People paying school fees, healthcare or bills for a relative",
    who4: "Entrepreneurs with small expenses to settle abroad",

    comTitle: "Trust is built with every transfer",
    comSubtitle: "Our commitments to you and your loved ones.",
    com1Title: "Transparency",
    com1Text: "Fees and exchange rate are shown before any confirmation. No bad surprises.",
    com2Title: "Security",
    com2Text: "Encrypted data, checks before sending and protected access to your account.",
    com3Title: "Human support",
    com3Text: "A team you can reach in French and English to answer your questions.",
    com4Title: "Compliance",
    com4Text: "We verify our customers' identity when regulations require it, to protect everyone against fraud.",

    faq1Q: "How long does a transfer take?",
    faq1A:
      "Transfers to a mobile money wallet are usually processed quickly once payment is confirmed. Bank transfers may take longer depending on the recipient's bank. The estimated delivery time is shown before you confirm.",
    faq2Q: "What are the fees?",
    faq2A:
      "Fees and exchange rate depend on the country and the amount. They are shown in the calculator and summarized before payment: you know exactly what you pay and what your recipient gets.",
    faq3Q: "What do I need to send money?",
    faq3A:
      "A PWFINTECH account, a payment method and your recipient's details (full name, mobile money number or bank details). ID may be requested depending on the amount or regulations.",
    faq4Q: "How do I track my transfer?",
    faq4A:
      "Go to “My transfers”: each transfer shows its reference, status and receipt. Keep the reference handy if you contact us.",
    faq5Q: "I entered the wrong number, what should I do?",
    faq5A:
      "Contact us as soon as possible with the transfer reference. If the funds have not been paid out yet, we will do our best to correct or cancel the transfer.",

    ctaTitle: "Ready to send your first transfer?",
    ctaText: "Create your account in minutes and see exactly what your recipient will get.",
  },
  es: {
    heroEyebrow: "Envío de dinero",
    heroTitle: "Envíe dinero desde Canadá a África y al mundo",
    heroSubtitle:
      "Mobile money MTN y Orange, transferencia bancaria o retiro según el país: sus seres queridos reciben los fondos fácilmente, con comisiones mostradas antes de confirmar.",
    heroCta: "Enviar dinero",
    heroCta2: "Ver destinos",
    calcTitle: "Calcule su envío en segundos",
    howTitle: "Envíe dinero en 4 pasos",
    destTitle: "¿A dónde puede enviar?",
    ctaTitle: "¿Listo para su primer envío?",
  },
  zh: {
    heroEyebrow: "汇款",
    heroTitle: "从加拿大向非洲及全球汇款",
    heroSubtitle: "支持 MTN、Orange 移动钱包、银行转账或现金提取（视国家而定）：确认前即可看到费用。",
    heroCta: "立即汇款",
    heroCta2: "查看目的地",
    calcTitle: "几秒钟估算您的汇款",
    howTitle: "四步完成汇款",
    destTitle: "可以汇往哪里？",
    ctaTitle: "准备好第一笔汇款了吗？",
  },
});

/* ========================================================================== */
/* Finances                                                                    */
/* ========================================================================== */

export const financesPage = defineMessages({
  fr: {
    heroEyebrow: "Accompagnement financier",
    heroTitle: "Des finances claires pour avancer sereinement",
    heroSubtitle:
      "Budget, épargne, projet d'entreprise ou démarches administratives : nous vous accompagnons avec des conseils concrets, ici au Canada comme pour vos projets à l'étranger.",
    heroCta: "Prendre rendez-vous",
    heroCta2: "Découvrir nos services",
    hl1: "Approche personnalisée",
    hl2: "Particuliers et entreprises",
    hl3: "En français et en anglais",

    offerTitle: "Un accompagnement adapté à chaque étape de vie",
    offerSubtitle: "Des services simples et pédagogiques pour reprendre la main sur votre argent.",
    offer1Title: "Conseil et planification budgétaire",
    offer1Text:
      "Faire le point sur vos revenus et dépenses, construire un budget réaliste et l'ajuster au fil du temps.",
    offer2Title: "Épargne et objectifs",
    offer2Text:
      "Définir vos priorités (fonds d'urgence, études, achat, retour au pays) et mettre en place des habitudes d'épargne durables.",
    offer3Title: "Accompagnement des entreprises et PME",
    offer3Text:
      "Organisation financière, suivi de trésorerie, tableaux de bord et préparation de vos rencontres avec les banques.",
    offer4Title: "Entrepreneurs de la diaspora",
    offer4Text:
      "Structurer un projet entre le Canada et l'Afrique : budget prévisionnel, étapes clés et points de vigilance.",
    offer5Title: "Éducation financière",
    offer5Text:
      "Ateliers et séances individuelles pour comprendre le crédit, l'épargne, les frais bancaires et le système financier canadien.",
    offer6Title: "Aide aux démarches",
    offer6Text:
      "Préparation de dossiers, organisation de vos documents et accompagnement dans vos démarches financières et administratives.",

    howTitle: "Notre façon de vous accompagner",
    howSubtitle: "Une méthode simple, à votre rythme.",
    step1Title: "Premier échange",
    step1Text: "Nous prenons le temps de comprendre votre situation, vos besoins et vos objectifs.",
    step2Title: "Diagnostic",
    step2Text: "Nous analysons avec vous vos chiffres et identifions les priorités.",
    step3Title: "Plan d'action",
    step3Text: "Vous repartez avec des recommandations claires et des étapes concrètes.",
    step4Title: "Suivi",
    step4Text: "Nous faisons le point régulièrement pour ajuster le plan si besoin.",

    whoTitle: "Pour toutes celles et ceux qui veulent mieux gérer leur argent",
    whoSubtitle: "Peu importe votre point de départ, l'important est d'avancer avec méthode.",
    who1: "Les particuliers et familles qui veulent un budget plus serein",
    who2: "Les nouveaux arrivants qui découvrent le système financier canadien",
    who3: "Les entrepreneurs et PME qui souhaitent structurer leurs finances",
    who4: "Les membres de la diaspora qui préparent un projet au pays",
    who5: "Les étudiants qui gèrent leur premier budget",

    comTitle: "Un accompagnement de confiance",
    comSubtitle: "Ce que vous pouvez attendre de nous.",
    com1Title: "Écoute et bienveillance",
    com1Text: "Pas de jugement : nous partons de votre réalité pour construire des solutions adaptées.",
    com2Title: "Confidentialité",
    com2Text: "Vos informations personnelles et financières restent strictement confidentielles.",
    com3Title: "Pédagogie",
    com3Text: "Nous expliquons chaque recommandation pour que vous gagniez en autonomie.",
    com4Title: "Honnêteté",
    com4Text: "Si votre besoin dépasse notre rôle, nous vous le disons et vous orientons vers le bon professionnel.",

    disclaimerTitle: "Un accompagnement, pas un conseil en placement",
    disclaimerText:
      "Nos services relèvent de l'accompagnement et de l'éducation financière. Ils ne constituent pas un conseil en placement, fiscal ou juridique au sens réglementaire. Pour ces besoins, nous vous orienterons vers un professionnel dûment autorisé.",

    faq1Q: "À qui s'adresse l'accompagnement financier ?",
    faq1A:
      "Aux particuliers, aux familles, aux étudiants, aux entrepreneurs et aux PME. Que vous souhaitiez mieux gérer votre budget ou structurer un projet, nous adaptons l'accompagnement à votre situation.",
    faq2Q: "Vendez-vous des produits financiers ?",
    faq2A:
      "Non. Notre rôle est de vous aider à comprendre et organiser vos finances. Nous ne vendons pas de produits de placement et ne gérons pas votre argent.",
    faq3Q: "Les rendez-vous se font-ils à distance ?",
    faq3A:
      "Oui, les échanges peuvent se faire en ligne, ce qui permet de vous accompagner où que vous soyez. Contactez-nous pour convenir du format qui vous convient.",
    faq4Q: "Comment sont fixés les tarifs ?",
    faq4A:
      "Les tarifs dépendent du type d'accompagnement et de sa durée. Ils vous sont présentés clairement après le premier échange, avant tout engagement.",

    ctaTitle: "Faisons le point sur vos objectifs",
    ctaText: "Décrivez-nous votre situation : nous vous proposerons un accompagnement adapté.",
  },
  en: {
    heroEyebrow: "Financial guidance",
    heroTitle: "Clear finances to move forward with confidence",
    heroSubtitle:
      "Budgeting, savings, business projects or paperwork: we support you with practical guidance, here in Canada and for your projects abroad.",
    heroCta: "Book a meeting",
    heroCta2: "Explore our services",
    hl1: "Personalized approach",
    hl2: "Individuals and businesses",
    hl3: "In French and English",

    offerTitle: "Guidance for every stage of life",
    offerSubtitle: "Simple, educational services to take back control of your money.",
    offer1Title: "Budget advice and planning",
    offer1Text: "Review your income and expenses, build a realistic budget and adjust it over time.",
    offer2Title: "Savings and goals",
    offer2Text:
      "Define your priorities (emergency fund, studies, a purchase, moving back home) and build lasting saving habits.",
    offer3Title: "Business and SME support",
    offer3Text: "Financial organization, cash-flow tracking, dashboards and preparing your meetings with banks.",
    offer4Title: "Diaspora entrepreneurs",
    offer4Text:
      "Structure a project between Canada and Africa: forecast budget, key milestones and points of attention.",
    offer5Title: "Financial education",
    offer5Text:
      "Workshops and one-on-one sessions to understand credit, savings, bank fees and the Canadian financial system.",
    offer6Title: "Help with paperwork",
    offer6Text:
      "Preparing files, organizing your documents and support with your financial and administrative procedures.",

    howTitle: "How we support you",
    howSubtitle: "A simple method, at your own pace.",
    step1Title: "First conversation",
    step1Text: "We take the time to understand your situation, needs and goals.",
    step2Title: "Assessment",
    step2Text: "We review your numbers together and identify priorities.",
    step3Title: "Action plan",
    step3Text: "You leave with clear recommendations and concrete steps.",
    step4Title: "Follow-up",
    step4Text: "We check in regularly to adjust the plan when needed.",

    whoTitle: "For everyone who wants to manage their money better",
    whoSubtitle: "Wherever you're starting from, what matters is moving forward methodically.",
    who1: "Individuals and families looking for a calmer budget",
    who2: "Newcomers discovering the Canadian financial system",
    who3: "Entrepreneurs and SMEs who want to structure their finances",
    who4: "Diaspora members preparing a project back home",
    who5: "Students managing their first budget",

    comTitle: "Guidance you can trust",
    comSubtitle: "What you can expect from us.",
    com1Title: "Listening and care",
    com1Text: "No judgment: we start from your reality to build solutions that fit.",
    com2Title: "Confidentiality",
    com2Text: "Your personal and financial information stays strictly confidential.",
    com3Title: "Education first",
    com3Text: "We explain every recommendation so you become more independent.",
    com4Title: "Honesty",
    com4Text: "If your need goes beyond our role, we tell you and refer you to the right professional.",

    disclaimerTitle: "Guidance, not investment advice",
    disclaimerText:
      "Our services are financial guidance and education. They do not constitute regulated investment, tax or legal advice. For those needs, we will refer you to a duly authorized professional.",

    faq1Q: "Who is financial guidance for?",
    faq1A:
      "Individuals, families, students, entrepreneurs and SMEs. Whether you want to manage your budget better or structure a project, we adapt our support to your situation.",
    faq2Q: "Do you sell financial products?",
    faq2A:
      "No. Our role is to help you understand and organize your finances. We do not sell investment products and do not manage your money.",
    faq3Q: "Are meetings held remotely?",
    faq3A:
      "Yes, sessions can take place online, so we can support you wherever you are. Contact us to agree on the format that suits you.",
    faq4Q: "How are fees set?",
    faq4A:
      "Fees depend on the type and length of support. They are clearly presented after the first conversation, before any commitment.",

    ctaTitle: "Let's review your goals",
    ctaText: "Tell us about your situation and we'll suggest the right kind of support.",
  },
  es: {
    heroEyebrow: "Acompañamiento financiero",
    heroTitle: "Finanzas claras para avanzar con tranquilidad",
    heroCta: "Pedir una cita",
    heroCta2: "Nuestros servicios",
    offerTitle: "Un acompañamiento para cada etapa de la vida",
    ctaTitle: "Hablemos de sus objetivos",
  },
  zh: {
    heroEyebrow: "财务辅导",
    heroTitle: "清晰的财务，安心前行",
    heroCta: "预约咨询",
    heroCta2: "了解我们的服务",
    offerTitle: "陪伴您人生的每个阶段",
    ctaTitle: "一起梳理您的目标",
  },
});

/* ========================================================================== */
/* Technologies                                                                */
/* ========================================================================== */

export const techPage = defineMessages({
  fr: {
    heroEyebrow: "Technologies",
    heroTitle: "Des solutions numériques qui font grandir votre activité",
    heroSubtitle:
      "Sites web, applications mobiles, solutions de paiement et conseil IT : nous concevons des outils fiables, pensés pour vos clients au Canada, en Afrique et ailleurs.",
    heroCta: "Parler de votre projet",
    heroCta2: "Notre méthode",
    hl1: "Web et mobile",
    hl2: "Fintech et paiements",
    hl3: "Accompagnement de bout en bout",

    offerTitle: "Une équipe technique à vos côtés",
    offerSubtitle: "De l'idée au produit en ligne, puis au quotidien.",
    offer1Title: "Développement web et mobile",
    offer1Text:
      "Sites vitrines, plateformes et applications mobiles rapides, accessibles et faciles à faire évoluer.",
    offer2Title: "Solutions fintech et paiements",
    offer2Text:
      "Intégration de paiements en ligne et mobile money, portefeuilles, tableaux de bord : des parcours sécurisés et simples.",
    offer3Title: "Transformation numérique et conseil IT",
    offer3Text:
      "Audit de vos outils, choix technologiques, automatisation des tâches et feuille de route numérique réaliste.",
    offer4Title: "Maintenance et support",
    offer4Text:
      "Mises à jour, sauvegardes, surveillance et corrections pour que vos services restent disponibles et sûrs.",
    offer5Title: "Formation",
    offer5Text: "Prise en main de vos outils et sensibilisation de vos équipes aux bonnes pratiques numériques.",

    howTitle: "Une méthode claire, de la découverte au lancement",
    howSubtitle: "Vous savez à chaque étape où en est votre projet.",
    step1Title: "Découverte",
    step1Text: "Nous écoutons vos besoins, vos utilisateurs et vos contraintes pour cadrer le projet.",
    step2Title: "Conception",
    step2Text: "Parcours, maquettes et architecture technique validés avec vous avant de coder.",
    step3Title: "Développement",
    step3Text: "Livraisons régulières, tests et points d'avancement pour garder le cap.",
    step4Title: "Lancement et suivi",
    step4Text: "Mise en ligne accompagnée, formation, puis maintenance et améliorations continues.",

    whoTitle: "Pour les organisations qui veulent passer au numérique",
    whoSubtitle: "Que vous partiez de zéro ou que vous ayez déjà des outils, nous construisons avec vous.",
    who1: "Les startups qui veulent lancer un produit solide",
    who2: "Les PME qui souhaitent moderniser leurs outils et leurs ventes",
    who3: "Les associations et organisations qui ont besoin d'une présence en ligne fiable",
    who4: "Les entrepreneurs de la diaspora qui développent une activité entre le Canada et l'Afrique",

    comTitle: "Nos engagements techniques",
    comSubtitle: "Construire des outils durables, c'est une question de méthode.",
    com1Title: "Qualité",
    com1Text: "Un code lisible, testé et documenté, pour un produit qui peut évoluer sans tout réécrire.",
    com2Title: "Sécurité dès la conception",
    com2Text: "Protection des données et bonnes pratiques de sécurité intégrées dès le départ.",
    com3Title: "Transparence",
    com3Text: "Devis clair, priorités partagées et points réguliers : pas de boîte noire.",
    com4Title: "Accessibilité et performance",
    com4Text: "Des interfaces rapides et utilisables par tous, y compris sur mobile et en connexion limitée.",

    faq1Q: "Combien coûte un projet ?",
    faq1A:
      "Chaque projet est différent. Après un premier échange, nous vous remettons une estimation détaillée selon le périmètre, les délais et les fonctionnalités souhaitées.",
    faq2Q: "Combien de temps faut-il pour créer un site ou une application ?",
    faq2A:
      "Cela dépend de la complexité. Un calendrier réaliste vous est proposé dès la phase de découverte, avec des étapes de livraison intermédiaires.",
    faq3Q: "Pouvez-vous reprendre un projet existant ?",
    faq3A:
      "Oui. Nous commençons par un audit de l'existant pour évaluer son état et vous proposer la meilleure façon d'avancer.",
    faq4Q: "Qui est propriétaire du code et des données ?",
    faq4A:
      "Les conditions de propriété sont définies clairement dans le contrat. Notre approche par défaut : vos données vous appartiennent et vous gardez la maîtrise de votre produit.",

    ctaTitle: "Parlons de votre projet numérique",
    ctaText: "Présentez-nous votre idée ou votre besoin : nous revenons vers vous avec des pistes concrètes.",
  },
  en: {
    heroEyebrow: "Technologies",
    heroTitle: "Digital solutions that help your business grow",
    heroSubtitle:
      "Websites, mobile apps, payment solutions and IT consulting: we build reliable tools designed for your customers in Canada, Africa and beyond.",
    heroCta: "Discuss your project",
    heroCta2: "Our method",
    hl1: "Web and mobile",
    hl2: "Fintech and payments",
    hl3: "End-to-end support",

    offerTitle: "A technical team by your side",
    offerSubtitle: "From idea to live product, and every day after that.",
    offer1Title: "Web and mobile development",
    offer1Text: "Websites, platforms and mobile apps that are fast, accessible and easy to evolve.",
    offer2Title: "Fintech and payment solutions",
    offer2Text:
      "Online and mobile money payment integration, wallets, dashboards: secure and simple user journeys.",
    offer3Title: "Digital transformation and IT consulting",
    offer3Text: "Tool audits, technology choices, task automation and a realistic digital roadmap.",
    offer4Title: "Maintenance and support",
    offer4Text: "Updates, backups, monitoring and fixes to keep your services available and secure.",
    offer5Title: "Training",
    offer5Text: "Onboarding on your tools and raising your teams' awareness of good digital practices.",

    howTitle: "A clear method, from discovery to launch",
    howSubtitle: "At every step, you know where your project stands.",
    step1Title: "Discovery",
    step1Text: "We listen to your needs, users and constraints to frame the project.",
    step2Title: "Design",
    step2Text: "User flows, mockups and technical architecture approved with you before coding.",
    step3Title: "Development",
    step3Text: "Regular deliveries, testing and progress check-ins to stay on track.",
    step4Title: "Launch and follow-up",
    step4Text: "Assisted go-live, training, then maintenance and continuous improvement.",

    whoTitle: "For organizations ready to go digital",
    whoSubtitle: "Whether you're starting from scratch or already have tools, we build with you.",
    who1: "Startups that want to launch a solid product",
    who2: "SMEs looking to modernize their tools and sales",
    who3: "Non-profits and organizations that need a reliable online presence",
    who4: "Diaspora entrepreneurs growing a business between Canada and Africa",

    comTitle: "Our technical commitments",
    comSubtitle: "Building lasting tools is a matter of method.",
    com1Title: "Quality",
    com1Text: "Readable, tested and documented code, for a product that can evolve without a rewrite.",
    com2Title: "Security by design",
    com2Text: "Data protection and security best practices built in from the start.",
    com3Title: "Transparency",
    com3Text: "Clear quotes, shared priorities and regular check-ins: no black box.",
    com4Title: "Accessibility and performance",
    com4Text: "Fast interfaces usable by everyone, including on mobile and limited connections.",

    faq1Q: "How much does a project cost?",
    faq1A:
      "Every project is different. After a first conversation, we give you a detailed estimate based on scope, timeline and desired features.",
    faq2Q: "How long does it take to build a website or app?",
    faq2A:
      "It depends on complexity. A realistic schedule is proposed during discovery, with intermediate delivery milestones.",
    faq3Q: "Can you take over an existing project?",
    faq3A: "Yes. We start with an audit of what exists to assess it and suggest the best way forward.",
    faq4Q: "Who owns the code and the data?",
    faq4A:
      "Ownership terms are clearly defined in the contract. Our default approach: your data belongs to you and you stay in control of your product.",

    ctaTitle: "Let's talk about your digital project",
    ctaText: "Share your idea or need with us and we'll come back with concrete options.",
  },
  es: {
    heroEyebrow: "Tecnologías",
    heroTitle: "Soluciones digitales que hacen crecer su actividad",
    heroCta: "Hablar de su proyecto",
    heroCta2: "Nuestro método",
    howTitle: "Un método claro, del descubrimiento al lanzamiento",
    ctaTitle: "Hablemos de su proyecto digital",
  },
  zh: {
    heroEyebrow: "科技",
    heroTitle: "助力业务增长的数字化解决方案",
    heroCta: "洽谈您的项目",
    heroCta2: "我们的方法",
    howTitle: "从探索到上线的清晰流程",
    ctaTitle: "聊聊您的数字化项目",
  },
});

/* ========================================================================== */
/* Shipping                                                                    */
/* ========================================================================== */

export const shippingPage = defineMessages({
  fr: {
    heroEyebrow: "Shipping",
    heroTitle: "Vos colis et marchandises du Canada vers l'Afrique et le monde",
    heroSubtitle:
      "Fret aérien ou maritime, achat pour votre compte, accompagnement au dédouanement et suivi : nous vous aidons à expédier en toute sérénité.",
    heroCta: "Demander un devis",
    heroCta2: "Nos services",
    hl1: "Aérien et maritime",
    hl2: "Devis personnalisé",
    hl3: "Suivi de vos envois",

    offerTitle: "Une solution pour chaque envoi",
    offerSubtitle: "Du petit colis familial à la marchandise professionnelle.",
    offer1Title: "Fret aérien",
    offer1Text: "La solution rapide pour les colis urgents, les documents et les envois légers.",
    offer2Title: "Fret maritime",
    offer2Text: "L'option économique pour les envois volumineux ou lourds, effets personnels et marchandises.",
    offer3Title: "Achat et expédition pour vous",
    offer3Text:
      "Vous repérez un article au Canada ? Nous pouvons l'acheter pour votre compte et l'expédier à destination.",
    offer4Title: "Accompagnement au dédouanement",
    offer4Text:
      "Aide à la préparation des documents et des déclarations pour faciliter le passage en douane.",
    offer5Title: "Suivi de vos envois",
    offer5Text: "Vous êtes informé des grandes étapes de votre envoi, du départ jusqu'à la remise.",
    offer6Title: "Conseils d'emballage",
    offer6Text: "Des recommandations pour protéger vos biens et éviter les mauvaises surprises en route.",

    modesEyebrow: "Aérien ou maritime ?",
    modesTitle: "Choisissez le mode qui vous convient",
    modesSubtitle: "Les délais et tarifs indicatifs vous sont communiqués avec votre devis, selon la destination.",
    airTitle: "Fret aérien",
    airTag: "Rapide",
    air1: "Idéal pour les colis urgents et légers",
    air2: "Documents, vêtements, électronique conforme",
    air3: "Tarif calculé selon le poids réel ou volumétrique",
    seaTitle: "Fret maritime",
    seaTag: "Économique",
    sea1: "Adapté aux envois lourds ou volumineux",
    sea2: "Effets personnels, déménagement, marchandises",
    sea3: "Coût réduit pour des délais plus longs",

    howTitle: "Expédier en 4 étapes",
    howSubtitle: "Un accompagnement du devis jusqu'à la remise.",
    step1Title: "Demandez un devis",
    step1Text: "Décrivez votre envoi avec le formulaire ci-dessous : nous revenons vers vous avec une proposition.",
    step2Title: "Préparez votre colis",
    step2Text: "Nous convenons ensemble des modalités de dépôt ou de collecte et de l'emballage.",
    step3Title: "Expédition et douane",
    step3Text: "Votre envoi part par avion ou bateau ; nous vous accompagnons pour les formalités.",
    step4Title: "Livraison",
    step4Text: "Votre colis est remis à destination et vous êtes tenu informé des étapes.",

    quoteEyebrow: "Devis gratuit et sans engagement",
    quoteTitle: "Demander un devis",
    quoteSubtitle:
      "Remplissez le formulaire : votre application de messagerie s'ouvrira avec un courriel prêt à envoyer à notre équipe.",
    quotePoint1: "Réponse personnalisée par courriel",
    quotePoint2: "Tarif et délai indicatif selon la destination",
    quotePoint3: "Aucun engagement de votre part",
    fOrigin: "Ville / pays de départ",
    fDestination: "Ville / pays de destination",
    fDestinationPh: "Ex. Douala, Cameroun",
    fType: "Mode d'expédition",
    fAir: "Aérien",
    fSea: "Maritime",
    fWeight: "Poids estimé (kg)",
    fDims: "Dimensions (cm)",
    fLength: "Longueur",
    fWidth: "Largeur",
    fHeight: "Hauteur",
    fDescription: "Description du contenu",
    fDescriptionPh: "Ex. 2 valises de vêtements, un ordinateur portable…",
    fName: "Nom complet",
    fEmail: "Courriel",
    fPhone: "Téléphone",
    optional: "Facultatif",
    submit: "Envoyer ma demande",
    errRequired: "Ce champ est obligatoire.",
    errEmail: "Adresse courriel invalide.",
    errWeight: "Indiquez un poids supérieur à 0.",
    errSummary: "Veuillez corriger les champs signalés.",
    successTitle: "Votre demande est prête",
    successText:
      "Votre application de messagerie devrait s'ouvrir avec votre demande de devis. Envoyez le courriel et nous vous répondrons dans les meilleurs délais.",
    successRetry: "Rouvrir le courriel",
    successReset: "Nouvelle demande",
    mailSubject: "Demande de devis shipping — {origin} → {destination} ({type})",
    mailIntro: "Bonjour, je souhaite obtenir un devis pour l'envoi suivant :",
    mailOutro: "Merci de me recontacter.",
    privacyNote: "Vos informations servent uniquement à traiter votre demande.",

    prohibitedTitle: "Articles interdits ou réglementés",
    prohibitedText:
      "Pour votre sécurité et celle des transporteurs, certains articles ne peuvent pas être expédiés. La liste exacte dépend du mode de transport et du pays de destination : nous la confirmons avec votre devis.",
    p1: "Matières dangereuses, inflammables ou explosives",
    p2: "Gaz, aérosols et produits chimiques corrosifs",
    p3: "Batteries au lithium non conformes ou endommagées",
    p4: "Armes, munitions et répliques",
    p5: "Stupéfiants et substances illicites",
    p6: "Denrées périssables non autorisées",
    p7: "Contrefaçons et marchandises illégales",
    p8: "Argent liquide, bijoux et objets de grande valeur",
    p9: "Médicaments, alcool ou tabac sans autorisation",

    faq1Q: "Quels sont les délais de livraison ?",
    faq1A:
      "Ils dépendent du mode choisi et de la destination : le fret aérien est plus rapide, le fret maritime plus économique mais plus long. Un délai indicatif vous est communiqué avec le devis.",
    faq2Q: "Comment le prix est-il calculé ?",
    faq2A:
      "Le tarif dépend du poids, du volume, du mode de transport et de la destination. Pour l'aérien, le poids volumétrique peut s'appliquer s'il est supérieur au poids réel.",
    faq3Q: "Les droits de douane sont-ils inclus ?",
    faq3A:
      "Les droits et taxes à l'importation sont fixés par le pays de destination et restent généralement à la charge du destinataire. Nous vous aidons à les anticiper et à préparer les documents.",
    faq4Q: "Pouvez-vous acheter un article pour moi au Canada ?",
    faq4A:
      "Oui, c'est notre service « achat et expédition pour vous ». Indiquez l'article souhaité dans votre demande de devis et nous vous expliquerons les modalités.",

    ctaTitle: "Un envoi à préparer ?",
    ctaText: "Demandez votre devis gratuit : nous vous accompagnons de la préparation jusqu'à la remise.",
  },
  en: {
    heroEyebrow: "Shipping",
    heroTitle: "Your parcels and goods from Canada to Africa and the world",
    heroSubtitle:
      "Air or sea freight, shopping on your behalf, customs support and tracking: we help you ship with peace of mind.",
    heroCta: "Get a quote",
    heroCta2: "Our services",
    hl1: "Air and sea",
    hl2: "Personalized quote",
    hl3: "Shipment tracking",

    offerTitle: "A solution for every shipment",
    offerSubtitle: "From small family parcels to business goods.",
    offer1Title: "Air freight",
    offer1Text: "The fast option for urgent parcels, documents and light shipments.",
    offer2Title: "Sea freight",
    offer2Text: "The economical option for heavy or bulky shipments, personal effects and goods.",
    offer3Title: "Shop & ship for you",
    offer3Text: "Found an item in Canada? We can buy it on your behalf and ship it to its destination.",
    offer4Title: "Customs clearance support",
    offer4Text: "Help preparing documents and declarations to make customs clearance smoother.",
    offer5Title: "Shipment tracking",
    offer5Text: "You are kept informed of the key milestones of your shipment, from departure to delivery.",
    offer6Title: "Packing advice",
    offer6Text: "Recommendations to protect your goods and avoid bad surprises along the way.",

    modesEyebrow: "Air or sea?",
    modesTitle: "Choose the mode that suits you",
    modesSubtitle: "Indicative transit times and rates are provided with your quote, depending on the destination.",
    airTitle: "Air freight",
    airTag: "Fast",
    air1: "Ideal for urgent and light parcels",
    air2: "Documents, clothing, compliant electronics",
    air3: "Priced on actual or volumetric weight",
    seaTitle: "Sea freight",
    seaTag: "Economical",
    sea1: "Suited to heavy or bulky shipments",
    sea2: "Personal effects, relocation, goods",
    sea3: "Lower cost for longer transit times",

    howTitle: "Ship in 4 steps",
    howSubtitle: "Support from quote to delivery.",
    step1Title: "Request a quote",
    step1Text: "Describe your shipment with the form below and we'll come back with a proposal.",
    step2Title: "Prepare your parcel",
    step2Text: "We agree together on drop-off or pickup arrangements and packing.",
    step3Title: "Shipping and customs",
    step3Text: "Your shipment leaves by air or sea; we help you with the formalities.",
    step4Title: "Delivery",
    step4Text: "Your parcel is delivered at destination and you are kept informed along the way.",

    quoteEyebrow: "Free, no-obligation quote",
    quoteTitle: "Get a quote",
    quoteSubtitle: "Fill in the form: your email app will open with a message ready to send to our team.",
    quotePoint1: "Personalized reply by email",
    quotePoint2: "Indicative rate and transit time for your destination",
    quotePoint3: "No commitment on your side",
    fOrigin: "Origin city / country",
    fDestination: "Destination city / country",
    fDestinationPh: "e.g. Douala, Cameroon",
    fType: "Shipping mode",
    fAir: "Air",
    fSea: "Sea",
    fWeight: "Estimated weight (kg)",
    fDims: "Dimensions (cm)",
    fLength: "Length",
    fWidth: "Width",
    fHeight: "Height",
    fDescription: "Description of contents",
    fDescriptionPh: "e.g. 2 suitcases of clothes, a laptop…",
    fName: "Full name",
    fEmail: "Email",
    fPhone: "Phone",
    optional: "Optional",
    submit: "Send my request",
    errRequired: "This field is required.",
    errEmail: "Invalid email address.",
    errWeight: "Enter a weight greater than 0.",
    errSummary: "Please fix the highlighted fields.",
    successTitle: "Your request is ready",
    successText:
      "Your email app should open with your quote request. Send the email and we'll get back to you as soon as possible.",
    successRetry: "Reopen the email",
    successReset: "New request",
    mailSubject: "Shipping quote request — {origin} → {destination} ({type})",
    mailIntro: "Hello, I would like a quote for the following shipment:",
    mailOutro: "Thank you for getting back to me.",
    privacyNote: "Your information is only used to process your request.",

    prohibitedTitle: "Prohibited or restricted items",
    prohibitedText:
      "For your safety and that of carriers, some items cannot be shipped. The exact list depends on the transport mode and destination country: we confirm it with your quote.",
    p1: "Hazardous, flammable or explosive materials",
    p2: "Gases, aerosols and corrosive chemicals",
    p3: "Non-compliant or damaged lithium batteries",
    p4: "Weapons, ammunition and replicas",
    p5: "Narcotics and illegal substances",
    p6: "Unauthorized perishable goods",
    p7: "Counterfeit and illegal goods",
    p8: "Cash, jewelry and high-value items",
    p9: "Medication, alcohol or tobacco without authorization",

    faq1Q: "What are the delivery times?",
    faq1A:
      "They depend on the mode and destination: air freight is faster, sea freight cheaper but slower. An indicative transit time is given with your quote.",
    faq2Q: "How is the price calculated?",
    faq2A:
      "The rate depends on weight, volume, transport mode and destination. For air freight, volumetric weight may apply if it exceeds the actual weight.",
    faq3Q: "Are customs duties included?",
    faq3A:
      "Import duties and taxes are set by the destination country and are usually paid by the recipient. We help you anticipate them and prepare the documents.",
    faq4Q: "Can you buy an item for me in Canada?",
    faq4A:
      "Yes, that's our “shop & ship for you” service. Mention the item in your quote request and we'll explain how it works.",

    ctaTitle: "Got a shipment to prepare?",
    ctaText: "Request your free quote: we support you from preparation to delivery.",
  },
  es: {
    heroEyebrow: "Envíos",
    heroTitle: "Sus paquetes y mercancías de Canadá a África y al mundo",
    heroCta: "Pedir presupuesto",
    heroCta2: "Nuestros servicios",
    quoteTitle: "Pedir presupuesto",
    submit: "Enviar mi solicitud",
    ctaTitle: "¿Tiene un envío que preparar?",
  },
  zh: {
    heroEyebrow: "物流",
    heroTitle: "从加拿大寄往非洲及全球的包裹与货物",
    heroCta: "获取报价",
    heroCta2: "我们的服务",
    quoteTitle: "获取报价",
    submit: "提交请求",
    ctaTitle: "有货物需要寄送？",
  },
});
