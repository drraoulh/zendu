import Svg, { Circle, G, Path, Rect, SvgXml } from "react-native-svg";

import { BRAND_SVG } from "@/components/brand-svgs";

/**
 * Logos des moyens de réception (MTN MoMo, Orange Money, Alipay, WeChat Pay, Interac) et des cartes
 * (Visa, Mastercard, Amex) : fichiers officiels du dépôt Shopify « activemerchant/payment_icons »
 * (voir brand-svgs.ts). Virement, espèces et carte générique sont de simples pictogrammes au même format.
 */
export type PaymentLogoId =
  | "MTN"
  | "ORANGE"
  | "ALIPAY"
  | "WECHAT"
  | "INTERAC"
  | "BANK"
  | "CASH"
  | "VISA"
  | "MASTERCARD"
  | "AMEX"
  | "CARD";

const KNOWN = new Set<string>(["MTN", "ORANGE", "ALIPAY", "WECHAT", "INTERAC", "BANK", "CASH", "VISA", "MASTERCARD", "AMEX", "CARD"]);

/** Identifiant de logo pour une marque de carte enregistrée (« Visa », « Mastercard »…). */
export function cardLogoId(brand: string): PaymentLogoId {
  const b = brand.toUpperCase();
  return b === "VISA" || b === "MASTERCARD" || b === "AMEX" ? (b as PaymentLogoId) : "CARD";
}

/** Badge 38×24 ; `size` est la hauteur. */
export function PaymentLogo({ id, size = 28 }: { id: string; size?: number }) {
  const key = (KNOWN.has(id) ? id : "CARD") as PaymentLogoId;
  const w = Math.round((size * 38) / 24);
  if (key in BRAND_SVG) {
    return <SvgXml xml={BRAND_SVG[key as keyof typeof BRAND_SVG]} width={w} height={size} accessibilityLabel={LABEL[key]} />;
  }
  return (
    <Svg width={w} height={size} viewBox="0 0 38 24" accessibilityLabel={LABEL[key]}>
      {GENERIC[key as "BANK" | "CASH" | "CARD"]}
      <Rect x="0.5" y="0.5" width="37" height="23" rx="2.5" fill="none" stroke="#000" strokeOpacity={0.07} />
    </Svg>
  );
}

const LABEL: Record<PaymentLogoId, string> = {
  MTN: "MTN Mobile Money",
  ORANGE: "Orange Money",
  ALIPAY: "Alipay",
  WECHAT: "WeChat Pay",
  INTERAC: "Interac",
  BANK: "Virement bancaire",
  CASH: "Retrait en espèces",
  VISA: "Visa",
  MASTERCARD: "Mastercard",
  AMEX: "American Express",
  CARD: "Carte bancaire",
};

const GENERIC: Record<"BANK" | "CASH" | "CARD", React.ReactNode> = {
  BANK: (
    <G>
      <Rect width="38" height="24" rx="3" fill="#E6EDFF" />
      <Path d="M11 10 L19 5 L27 10 Z M13 11.5 h12 M14 12 v6 M17.7 12 v6 M20.3 12 v6 M24 12 v6 M11 19.5 h16" stroke="#0B4DFF" strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </G>
  ),
  CASH: (
    <G>
      <Rect width="38" height="24" rx="3" fill="#E3F6EE" />
      <Rect x="9" y="6.5" width="20" height="11" rx="1.5" fill="none" stroke="#0E8A59" strokeWidth="1.5" />
      <Circle cx="19" cy="12" r="2.7" fill="none" stroke="#0E8A59" strokeWidth="1.5" />
    </G>
  ),
  CARD: (
    <G>
      <Rect width="38" height="24" rx="3" fill="#E6EDFF" />
      <Rect x="9" y="6" width="20" height="12.5" rx="2" fill="none" stroke="#0B4DFF" strokeWidth="1.5" />
      <Path d="M9 10 h20" stroke="#0B4DFF" strokeWidth="2" />
    </G>
  ),
};
