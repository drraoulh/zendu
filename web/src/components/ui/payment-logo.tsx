import type { ReactNode } from "react";

/**
 * Logos des moyens de réception (MTN MoMo, Orange Money, Alipay, WeChat Pay, Interac) et des cartes
 * (Visa, Mastercard, Amex) : fichiers officiels du dépôt Shopify « activemerchant/payment_icons »
 * (licence MIT), servis depuis /public/brands — les mêmes que l'application mobile.
 * Virement, espèces et carte générique sont de simples pictogrammes au même format 38×24.
 */
const BRANDS = new Set(["MTN", "ORANGE", "ALIPAY", "WECHAT", "INTERAC", "VISA", "MASTERCARD", "AMEX"]);

const LABEL: Record<string, string> = {
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

/** Badge 38×24 ; `size` est la hauteur. `title=""` le rend décoratif. */
export function PaymentLogo({ id, size = 24, className = "", title }: { id: string; size?: number; className?: string; title?: string }) {
  const width = Math.round((size * 38) / 24);
  const label = title ?? LABEL[id] ?? LABEL.CARD;
  if (BRANDS.has(id)) {
    // eslint-disable-next-line @next/next/no-img-element -- petit SVG statique, next/image n'apporte rien
    return <img src={`/brands/${id.toLowerCase()}.svg`} width={width} height={size} alt={label} className={`shrink-0 ${className}`} />;
  }
  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 38 24"
      {...(title === "" ? { "aria-hidden": true } : { role: "img", "aria-label": label })}
      className={`shrink-0 ${className}`}
    >
      {GENERIC[id] ?? GENERIC.CARD}
      <rect x="0.5" y="0.5" width="37" height="23" rx="2.5" fill="none" stroke="#000" strokeOpacity={0.07} />
    </svg>
  );
}

const GENERIC: Record<string, ReactNode> = {
  BANK: (
    <g>
      <rect width="38" height="24" rx="3" fill="#E6EDFF" />
      <path d="M11 10 L19 5 L27 10 Z M13 11.5 h12 M14 12 v6 M17.7 12 v6 M20.3 12 v6 M24 12 v6 M11 19.5 h16" stroke="#0B4DFF" strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </g>
  ),
  CASH: (
    <g>
      <rect width="38" height="24" rx="3" fill="#E3F6EE" />
      <rect x="9" y="6.5" width="20" height="11" rx="1.5" fill="none" stroke="#0E8A59" strokeWidth="1.5" />
      <circle cx="19" cy="12" r="2.7" fill="none" stroke="#0E8A59" strokeWidth="1.5" />
    </g>
  ),
  CARD: (
    <g>
      <rect width="38" height="24" rx="3" fill="#E6EDFF" />
      <rect x="9" y="6" width="20" height="12.5" rx="2" fill="none" stroke="#0B4DFF" strokeWidth="1.5" />
      <path d="M9 10 h20" stroke="#0B4DFF" strokeWidth="2" />
    </g>
  ),
};
