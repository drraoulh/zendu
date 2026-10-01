export function roundMoney(n: number, currency: string): number {
  // XAF/XOF: no decimals
  if (currency === "XAF" || currency === "XOF") return Math.round(n);
  return Math.round(n * 100) / 100;
}

export function formatMoney(n: number, currency: string, locale = "fr-CA"): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "XAF" || currency === "XOF" ? 0 : 2,
    }).format(n);
  } catch {
    return `${n.toLocaleString(locale)} ${currency}`;
  }
}

export function createReference(prefix = "PW"): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}-${code}`;
}

/** @deprecated use formatMoney */
export function formatCad(n: number): string {
  return formatMoney(n, "CAD");
}

/** @deprecated use formatMoney */
export function formatXaf(n: number): string {
  return formatMoney(n, "XAF");
}

/** @deprecated use roundMoney */
export function roundCad(n: number): number {
  return roundMoney(n, "CAD");
}

/** @deprecated use roundMoney */
export function roundXaf(n: number): number {
  return roundMoney(n, "XAF");
}
