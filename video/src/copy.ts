import wordsEn from "./data/words-en.json";
import wordsFr from "./data/words-fr.json";

export type Lang = "fr" | "en";
export type Word = { text: string; start: number; end: number };

/**
 * Textes à l'écran et calage de chaque scène sur la voix off (secondes, tirées de la
 * transcription mot à mot d'ElevenLabs). Toutes les affirmations correspondent à l'appli réelle.
 */
export type Copy = {
  words: Word[];
  /** Début de chaque scène, dans l'ordre. */
  scenes: [number, number, number, number, number, number, number, number];
  /** Fin de la voix off. */
  voiceEnd: number;
  /** Moments clés à l'intérieur des scènes. */
  cues: { receive: number; interac: number; notification: number; receipt: number };
  hook: string[];
  intro: { kicker: string; tagline: string };
  amount: { title: string; badge: string };
  recipient: { title: string; methods: string[] };
  pay: { title: string; badge: string };
  track: { title: string; push: { app: string; title: string; body: string } };
  trust: { title: string; items: { icon: "shield" | "lock" | "globe"; label: string }[] };
  end: { tagline: string; soon: string; url: string };
};

const METHODS = ["MTN Mobile Money", "Orange Money", "Alipay", "WeChat Pay"];

export const COPY: Record<Lang, Copy> = {
  fr: {
    words: wordsFr,
    scenes: [0, 3.36, 7.92, 17.08, 24.32, 28.24, 35.6, 42.08],
    voiceEnd: 47.52,
    cues: { receive: 9.68, interac: 25.44, notification: 30.4, receipt: 33.32 },
    hook: ["Envoyer", "de l'argent", "à vos proches,", "ça devrait être", "simple."],
    intro: { kicker: "Une solution PWFINTECH", tagline: "Canada · Cameroun · Chine" },
    amount: { title: "Vous choisissez le montant… ou ce qu'il reçoit", badge: "0 frais vers le Cameroun" },
    recipient: { title: "Vos proches, en un geste", methods: [...METHODS, "Compte bancaire"] },
    pay: { title: "Payez par virement Interac", badge: "Depuis votre banque canadienne" },
    track: {
      title: "Suivi en temps réel",
      push: { app: "WORLDSOFT TRANSFER", title: "Marie a reçu 80 770 FCFA", body: "Votre transfert PW-7K3M9Q est livré." },
    },
    trust: {
      title: "En toute confiance",
      items: [
        { icon: "shield", label: "Identité vérifiée" },
        { icon: "lock", label: "Données protégées" },
        { icon: "globe", label: "Français · English · Español · 中文" },
      ],
    },
    end: { tagline: "Votre argent, là où ça compte.", soon: "Bientôt sur l'App Store et Google Play", url: "worldsoft-transfer.vercel.app" },
  },
  en: {
    words: wordsEn,
    scenes: [0, 3.12, 7.2, 16.0, 23.2, 27.2, 34.4, 40.56],
    voiceEnd: 45.92,
    cues: { receive: 8.6, interac: 24.56, notification: 29.52, receipt: 32.4 },
    hook: ["Sending money", "to the people", "you love", "should be", "simple."],
    intro: { kicker: "A PWFINTECH solution", tagline: "Canada · Cameroon · China" },
    amount: { title: "Choose what you send… or what they receive", badge: "No transfer fee to Cameroon" },
    recipient: { title: "Your loved ones, in one tap", methods: [...METHODS, "Bank account"] },
    pay: { title: "Pay by Interac e-Transfer", badge: "From your Canadian bank" },
    track: {
      title: "Real-time tracking",
      push: { app: "WORLDSOFT TRANSFER", title: "Marie received 80,770 FCFA", body: "Your transfer PW-7K3M9Q has been delivered." },
    },
    trust: {
      title: "Built on trust",
      items: [
        { icon: "shield", label: "Verified identity" },
        { icon: "lock", label: "Protected data" },
        { icon: "globe", label: "English · Français · Español · 中文" },
      ],
    },
    end: { tagline: "Your money, where it matters.", soon: "Coming soon to the App Store and Google Play", url: "worldsoft-transfer.vercel.app" },
  },
};

export const FPS = 30;
/** Carton de fin tenu après la dernière phrase. */
export const END_HOLD = 3.2;

export function durationInFrames(lang: Lang) {
  return Math.ceil((COPY[lang].voiceEnd + END_HOLD) * FPS);
}
