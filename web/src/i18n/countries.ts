import { defineMessages } from "@/i18n/define";

/** /pays et /pays/[code] — trois pays ouverts : Canada, Cameroun, Chine. */
export const countriesMessages = defineMessages({
  fr: {
    feeFree: "Gratuit",
    heroEyebrow: "Nos pays",
    heroTitle: "Canada, Cameroun, Chine : envoyez dans les deux sens",
    heroSubtitle:
      "WorldSoft Transfer relie pour le moment trois pays. Chacun peut envoyer vers les deux autres et en recevoir : mobile money au Cameroun, Interac ou compte bancaire au Canada, Alipay, WeChat Pay ou compte bancaire en Chine.",
    routesCount: "{n} trajets ouverts",
    currency: "Devise : {c}",
    receiveWith: "Réception",
    sendTo: "Envoyer vers",
    receiveFrom: "Recevoir depuis",
    seeCountry: "Voir la page",
    feesLink: "Comparer les frais de tous les trajets",
    soon: "D'autres pays suivront. Dites-nous où vous voulez envoyer de l'argent.",
    ctaTitle: "Un autre pays vous intéresse ?",
    ctaText: "Vos demandes nous aident à choisir les prochains pays à ouvrir.",
    ctaContact: "Nous écrire",
    ctaFees: "Frais et délais",

    breadcrumb: "Nos pays",
    eyebrow: "Transfert d'argent · {country}",
    title: "Envoyer de l'argent {to}",
    subtitle:
      "Vos proches reçoivent en {currency} ({currencyName}) par {modes}. Simulez sur le site, envoyez avec l'application WorldSoft Transfer.",
    modesJoin: " ou ",
    simulateTo: "Simuler un envoi {to}",

    factCurrency: "Devise reçue",
    factDelivery: "Délai indicatif",
    factFrom: "Envois possibles depuis",
    factTo: "Envois possibles vers",

    modesEyebrow: "Modes de réception",
    modesTitle: "Comment l'argent est reçu {in}",
    modeDelivery: "Délai estimé : {d}",
    modeMOBILE: "Directement sur le portefeuille {network} du destinataire, à partir de son numéro de téléphone.",
    modeINTERAC: "Par virement Interac, à partir du courriel ou du numéro de téléphone du destinataire.",
    modeALIPAY: "Sur le compte Alipay du destinataire, à partir du numéro de téléphone associé.",
    modeWECHAT: "Sur le compte WeChat Pay du destinataire, à partir du numéro de téléphone associé.",
    modeBANK: "Sur le compte bancaire du destinataire, à partir de son numéro de compte (et, si demandé, du code de la banque).",
    modeCASH: "Le destinataire retire les espèces dans un point de retrait, muni d'une pièce d'identité et de la référence du transfert.",

    inboundEyebrow: "Envoyer {to}",
    inboundTitle: "Frais pour envoyer {to}",
    inboundSubtitle: "Calculés avec le même moteur que le simulateur, dans la devise du pays d'envoi. Le taux et le montant reçu sont confirmés avant paiement.",
    fromCountry: "{from}",
    colSend: "Vous envoyez",
    colFee: "Frais",
    colTotal: "Total payé",
    colReceive: "Reçu (≈)",
    feesUnavailable: "Les frais ne peuvent pas être calculés pour le moment. Utilisez le simulateur pour obtenir un montant à jour.",
    simulate: "Simuler",

    outboundEyebrow: "{from}",
    outboundTitle: "Vous êtes {in} ? Envoyez vers",
    outboundText: "Envoi payé en {currency}, frais et montant reçu affichés avant de payer.",

    banksEyebrow: "Virement bancaire",
    banksTitle: "Banques courantes {in}",
    banksText:
      "Le destinataire peut avoir un compte dans la plupart des banques du pays. Voici quelques banques courantes, proposées comme suggestions lors de la saisie (liste non exhaustive ; ce ne sont pas des partenaires de PWFINTECH).",

    tipsEyebrow: "Conseils",
    tipsTitle: "Pour que l'argent arrive du premier coup",
    tipName: "Saisissez le nom du destinataire exactement comme sur son compte : une différence peut bloquer le versement.",
    tipPhone: "Vérifiez le numéro avec l'indicatif +{dial} et assurez-vous que le compte du destinataire est actif.",
    tipBank: "Pour un virement, vérifiez le numéro de compte et le nom de la banque avant de confirmer.",
    tipRef: "Conservez la référence du transfert : elle permet de suivre l'envoi et de nous contacter plus rapidement.",
    tipScam: "N'envoyez jamais d'argent à une personne que vous n'avez jamais rencontrée ou qui vous presse d'agir.",

    faqTitle: "Questions fréquentes",
    faq1Q: "Combien de temps faut-il pour envoyer de l'argent {to} ?",
    faq1A: "Délai indicatif selon le mode de réception : {modesDelays}. Le délai estimé est toujours indiqué avant l'envoi.",
    faq2Q: "Quels sont les frais pour envoyer {to} ?",
    faq2A: "Une part fixe plus un pourcentage du montant envoyé, dans la devise du pays d'envoi. Par exemple, {example}. Le taux et le montant reçu sont confirmés avant le paiement.",
    faq3Q: "En quelle devise le destinataire reçoit-il l'argent ?",
    faq3A: "En {currency} ({currencyName}). Le montant est converti au taux affiché au moment de votre confirmation.",
    faq4Q: "Puis-je envoyer depuis le site web ?",
    faq4A: "Le site permet de simuler l'envoi et de connaître les frais. L'envoi se fait dans l'application WorldSoft Transfer, où vous enregistrez vos destinataires et suivez chaque transfert.",

    otherTitle: "Nos autres pays",
    countryCtaTitle: "Prêt à envoyer {to} ?",
    countryCtaText: "Simulez le montant exact, puis finalisez l'envoi dans l'application WorldSoft Transfer.",
    help: "Centre d'aide",
  },
  en: {
    feeFree: "Free",
    heroEyebrow: "Our countries",
    heroTitle: "Canada, Cameroon, China: send both ways",
    heroSubtitle:
      "WorldSoft Transfer currently connects three countries. Each one can send to and receive from the other two: mobile money in Cameroon, Interac or bank account in Canada, Alipay, WeChat Pay or bank account in China.",
    routesCount: "{n} open routes",
    currency: "Currency: {c}",
    receiveWith: "Payout",
    sendTo: "Send to",
    receiveFrom: "Receive from",
    seeCountry: "See page",
    feesLink: "Compare fees on every route",
    soon: "More countries will follow. Tell us where you want to send money.",
    ctaTitle: "Interested in another country?",
    ctaText: "Your requests help us choose the next countries to open.",
    ctaContact: "Write to us",
    ctaFees: "Fees and delivery",

    breadcrumb: "Our countries",
    eyebrow: "Money transfer · {country}",
    title: "Send money {to}",
    subtitle:
      "Your recipients receive {currency} ({currencyName}) via {modes}. Simulate on the website, send with the WorldSoft Transfer app.",
    modesJoin: " or ",
    simulateTo: "Simulate a transfer {to}",

    factCurrency: "Currency received",
    factDelivery: "Indicative delivery",
    factFrom: "Can receive from",
    factTo: "Can send to",

    modesEyebrow: "Payout methods",
    modesTitle: "How money is received {in}",
    modeDelivery: "Estimated delivery: {d}",
    modeMOBILE: "Straight to the recipient's {network} wallet, using their phone number.",
    modeINTERAC: "By Interac e-Transfer, using the recipient's email or phone number.",
    modeALIPAY: "To the recipient's Alipay account, using the linked phone number.",
    modeWECHAT: "To the recipient's WeChat Pay account, using the linked phone number.",
    modeBANK: "To the recipient's bank account, using their account number (and the bank code if required).",
    modeCASH: "The recipient collects cash at a pickup point with valid ID and the transfer reference.",

    inboundEyebrow: "Send {to}",
    inboundTitle: "Fees to send {to}",
    inboundSubtitle: "Calculated by the same engine as the simulator, in the sending country's currency. The rate and amount received are confirmed before payment.",
    fromCountry: "{from}",
    colSend: "You send",
    colFee: "Fee",
    colTotal: "Total paid",
    colReceive: "Received (≈)",
    feesUnavailable: "Fees cannot be calculated right now. Use the simulator for an up-to-date amount.",
    simulate: "Simulate",

    outboundEyebrow: "{from}",
    outboundTitle: "Are you {in}? Send to",
    outboundText: "Paid in {currency}, with fees and amount received shown before you pay.",

    banksEyebrow: "Bank transfer",
    banksTitle: "Common banks {in}",
    banksText:
      "The recipient can bank with most banks in the country. Here are a few common ones, suggested while typing (not exhaustive; they are not PWFINTECH partners).",

    tipsEyebrow: "Tips",
    tipsTitle: "So the money arrives first time",
    tipName: "Enter the recipient's name exactly as on their account: a mismatch can block the payout.",
    tipPhone: "Check the number with the +{dial} country code and make sure the recipient's account is active.",
    tipBank: "For a bank transfer, check the account number and bank name before confirming.",
    tipRef: "Keep the transfer reference: it lets you track it and reach us faster.",
    tipScam: "Never send money to someone you have never met or who pressures you to act.",

    faqTitle: "Frequently asked questions",
    faq1Q: "How long does it take to send money {to}?",
    faq1A: "Indicative delivery by payout method: {modesDelays}. The estimated time is always shown before you send.",
    faq2Q: "What are the fees to send {to}?",
    faq2A: "A fixed part plus a percentage of the amount sent, in the sending country's currency. For example, {example}. The rate and amount received are confirmed before payment.",
    faq3Q: "In which currency does the recipient get the money?",
    faq3A: "In {currency} ({currencyName}). The amount is converted at the rate shown when you confirm.",
    faq4Q: "Can I send from the website?",
    faq4A: "The website lets you simulate and see the fees. Sending happens in the WorldSoft Transfer app, where you save recipients and track every transfer.",

    otherTitle: "Our other countries",
    countryCtaTitle: "Ready to send {to}?",
    countryCtaText: "Simulate the exact amount, then complete the transfer in the WorldSoft Transfer app.",
    help: "Help center",
  },
  es: {
    heroEyebrow: "Nuestros países",
    heroTitle: "Canadá, Camerún, China: envíe en ambos sentidos",
    ctaContact: "Escríbanos",
  },
  zh: {
    heroEyebrow: "服务国家",
    heroTitle: "加拿大、喀麦隆、中国：双向汇款",
    ctaContact: "联系我们",
  },
});

/** « vers le Canada », « au Cameroun », « en Chine »… selon la langue. */
type Phrase = { to: string; in: string; from: string };
const PHRASES: Record<string, Record<string, Phrase>> = {
  fr: {
    CA: { to: "vers le Canada", in: "au Canada", from: "depuis le Canada" },
    CM: { to: "vers le Cameroun", in: "au Cameroun", from: "depuis le Cameroun" },
    CN: { to: "vers la Chine", in: "en Chine", from: "depuis la Chine" },
  },
  en: {
    CA: { to: "to Canada", in: "in Canada", from: "from Canada" },
    CM: { to: "to Cameroon", in: "in Cameroon", from: "from Cameroon" },
    CN: { to: "to China", in: "in China", from: "from China" },
  },
};

export function countryPhrase(locale: string, code: string, name: string): Phrase {
  const lang = locale === "fr" ? "fr" : "en";
  return (
    PHRASES[lang][code] ??
    (lang === "fr"
      ? { to: `vers ${name}`, in: `en ${name}`, from: `depuis ${name}` }
      : { to: `to ${name}`, in: `in ${name}`, from: `from ${name}` })
  );
}

/** Première lettre en majuscule (« Depuis la Chine »). */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Regroupe les réseaux de même délai : « Alipay, WeChat Pay : moins de 24 h · Banque : 1 à 2 jours ». */
export function groupByDelivery<T extends { delivery: string }>(
  items: T[],
  label: (n: T) => string,
  delivery: (d: string) => string,
): string {
  const groups = new Map<string, string[]>();
  for (const n of items) {
    const key = delivery(n.delivery);
    groups.set(key, [...(groups.get(key) ?? []), label(n)]);
  }
  return [...groups.entries()].map(([d, names]) => `${names.join(", ")} — ${d.toLowerCase()}`).join(" · ");
}
