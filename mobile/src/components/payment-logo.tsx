import Svg, { Circle, Ellipse, G, Path, Rect, Text } from "react-native-svg";

/**
 * Logos des moyens de réception (MTN MoMo, Orange Money, Alipay, WeChat Pay, Interac…) et des cartes
 * (Visa, Mastercard, Amex), dessinés en SVG dans un badge 3:2.
 * Reproductions simplifiées : à remplacer par les fichiers officiels des chartes de chaque marque
 * avant la publication sur les stores.
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

/** Police sans empattement (le web affiche sinon un caractère à empattements dans les SVG). */
const FONT = "Arial";

const KNOWN = new Set<string>(["MTN", "ORANGE", "ALIPAY", "WECHAT", "INTERAC", "BANK", "CASH", "VISA", "MASTERCARD", "AMEX", "CARD"]);

/** Identifiant de logo pour une marque de carte enregistrée (« Visa », « Mastercard »…). */
export function cardLogoId(brand: string): PaymentLogoId {
  const b = brand.toUpperCase();
  return b === "VISA" || b === "MASTERCARD" || b === "AMEX" ? (b as PaymentLogoId) : "CARD";
}

export function PaymentLogo({ id, size = 28, bordered = true }: { id: string; size?: number; bordered?: boolean }) {
  const key = (KNOWN.has(id) ? id : "CARD") as PaymentLogoId;
  const w = Math.round(size * 1.5);
  return (
    <Svg width={w} height={size} viewBox="0 0 48 32" accessibilityLabel={LABEL[key]}>
      {LOGO[key]}
      {bordered ? <Rect x="0.5" y="0.5" width="47" height="31" rx="6" fill="none" stroke="rgba(10,24,56,0.12)" /> : null}
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

const LOGO: Record<PaymentLogoId, React.ReactNode> = {
  MTN: (
    <G>
      <Rect width="48" height="32" rx="6" fill="#FFCC00" />
      <Ellipse cx="24" cy="14.5" rx="17" ry="9" fill="none" stroke="#1D1D1B" strokeWidth="2" />
      <Text fontFamily={FONT} x="24" y="18.6" fontSize="11" fontWeight="900" fill="#1D1D1B" textAnchor="middle">
        MTN
      </Text>
      <Text fontFamily={FONT} x="24" y="29.5" fontSize="5.6" fontWeight="700" fill="#1D1D1B" textAnchor="middle">
        MoMo
      </Text>
    </G>
  ),
  ORANGE: (
    <G>
      <Rect width="48" height="32" rx="6" fill="#000000" />
      <Rect x="12" y="4" width="24" height="24" fill="#FF7900" />
      <Text fontFamily={FONT} x="14" y="25.5" fontSize="6.6" fontWeight="700" fill="#FFFFFF">
        orange
      </Text>
    </G>
  ),
  ALIPAY: (
    <G>
      <Rect width="48" height="32" rx="6" fill="#1677FF" />
      <Text fontFamily={FONT} x="24" y="15.5" fontSize="12" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
        支
      </Text>
      <Text fontFamily={FONT} x="24" y="26.5" fontSize="7.2" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
        Alipay
      </Text>
    </G>
  ),
  WECHAT: (
    <G>
      <Rect width="48" height="32" rx="6" fill="#07C160" />
      <Ellipse cx="20" cy="13" rx="8" ry="6.5" fill="#FFFFFF" />
      <Path d="M15 17.5 l-2 3.5 l4.5 -2 z" fill="#FFFFFF" />
      <Ellipse cx="29" cy="17" rx="6.5" ry="5.3" fill="#FFFFFF" stroke="#07C160" strokeWidth="1.2" />
      <Path d="M33 20.5 l2 3 l-4 -1.6 z" fill="#FFFFFF" />
      <Circle cx="17.3" cy="12" r="1.1" fill="#07C160" />
      <Circle cx="22.7" cy="12" r="1.1" fill="#07C160" />
      <Circle cx="27" cy="16.6" r="0.9" fill="#07C160" />
      <Circle cx="31" cy="16.6" r="0.9" fill="#07C160" />
      <Text fontFamily={FONT} x="24" y="29.6" fontSize="4.6" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
        WeChat Pay
      </Text>
    </G>
  ),
  INTERAC: (
    <G>
      <Rect width="48" height="32" rx="6" fill="#FDB913" />
      <Rect x="6" y="9" width="36" height="14" rx="2" fill="#1D1D1B" />
      <Text fontFamily={FONT} x="24" y="19.4" fontSize="8.6" fontWeight="800" fill="#FDB913" textAnchor="middle" fontStyle="italic">
        Interac
      </Text>
    </G>
  ),
  BANK: (
    <G>
      <Rect width="48" height="32" rx="6" fill="#E6EDFF" />
      <Path d="M14 13 L24 7 L34 13 Z M16 14.5 h16 M17 15 v8 M22 15 v8 M26 15 v8 M31 15 v8 M14 25 h20" stroke="#0B4DFF" strokeWidth="1.8" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </G>
  ),
  CASH: (
    <G>
      <Rect width="48" height="32" rx="6" fill="#E3F6EE" />
      <Rect x="11" y="9" width="26" height="14" rx="2" fill="none" stroke="#0E8A59" strokeWidth="1.8" />
      <Circle cx="24" cy="16" r="3.4" fill="none" stroke="#0E8A59" strokeWidth="1.8" />
    </G>
  ),
  VISA: (
    <G>
      <Rect width="48" height="32" rx="6" fill="#FFFFFF" />
      <Text fontFamily={FONT} x="24" y="20.5" fontSize="13.5" fontWeight="900" fontStyle="italic" fill="#1A1F71" textAnchor="middle">
        VISA
      </Text>
    </G>
  ),
  MASTERCARD: (
    <G>
      <Rect width="48" height="32" rx="6" fill="#FFFFFF" />
      <Circle cx="19.5" cy="16" r="8.5" fill="#EB001B" />
      <Circle cx="28.5" cy="16" r="8.5" fill="#F79E1B" />
      <Path d="M24 8.79 A8.5 8.5 0 0 1 24 23.21 A8.5 8.5 0 0 1 24 8.79 Z" fill="#FF5F00" />
    </G>
  ),
  AMEX: (
    <G>
      <Rect width="48" height="32" rx="6" fill="#2E77BC" />
      <Text fontFamily={FONT} x="24" y="19.6" fontSize="9.5" fontWeight="900" fill="#FFFFFF" textAnchor="middle">
        AMEX
      </Text>
    </G>
  ),
  CARD: (
    <G>
      <Rect width="48" height="32" rx="6" fill="#E6EDFF" />
      <Rect x="11" y="9" width="26" height="16" rx="2.5" fill="none" stroke="#0B4DFF" strokeWidth="1.8" />
      <Path d="M11 14 h26" stroke="#0B4DFF" strokeWidth="2.4" />
    </G>
  ),
};
