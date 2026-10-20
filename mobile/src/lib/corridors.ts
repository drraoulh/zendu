import { useEffect, useState } from "react";
import { api, type CorridorMeta, type Network, type PayMethod } from "./api";
import { tr } from "@/lib/i18n";

/** Pays ouverts (identiques au site). */
export const COUNTRIES = {
  CA: { code: "CA", name: "Canada", currency: "CAD", dialCode: "1", phonePlaceholder: "514 555 0123", min: 10, max: 5000 },
  CM: { code: "CM", name: "Cameroun", currency: "XAF", dialCode: "237", phonePlaceholder: "6 70 00 00 00", min: 5000, max: 3_000_000 },
  CN: { code: "CN", name: "Chine", currency: "CNY", dialCode: "86", phonePlaceholder: "138 0013 8000", min: 50, max: 30_000 },
} as const;

export type CountryCode = keyof typeof COUNTRIES;
export const COUNTRY_CODES = Object.keys(COUNTRIES) as CountryCode[];

const NETWORKS: Record<CountryCode, Network[]> = {
  CA: [
    { id: "INTERAC", label: tr("Interac e-Transfer"), type: "mobile_money" },
    { id: "BANK", label: tr("Bank account"), type: "bank" },
  ],
  CM: [
    { id: "MTN", label: tr("MTN MoMo"), type: "mobile_money" },
    { id: "ORANGE", label: tr("Orange Money"), type: "mobile_money" },
    { id: "BANK", label: tr("Bank account"), type: "bank" },
  ],
  CN: [
    { id: "ALIPAY", label: tr("Alipay"), type: "mobile_money" },
    { id: "WECHAT", label: tr("WeChat Pay"), type: "mobile_money" },
    { id: "BANK", label: tr("Bank account"), type: "bank" },
  ],
};

/** Corridors de secours si l'API n'est pas joignable (mêmes règles que web/src/lib/corridors.ts). */
export const FALLBACK_CORRIDORS: CorridorMeta[] = COUNTRY_CODES.flatMap((source) =>
  COUNTRY_CODES.filter((d) => d !== source).map((destination) => ({
    id: `${source}-${destination}`,
    source,
    destination,
    active: true,
    minSend: COUNTRIES[source].min,
    maxSend: COUNTRIES[source].max,
    deliveryEstimate: destination === "CM" ? "A few minutes" : "Under 24h",
    sourceName: COUNTRIES[source].name,
    destName: COUNTRIES[destination].name,
    sendCurrency: COUNTRIES[source].currency,
    receiveCurrency: COUNTRIES[destination].currency,
    networks: NETWORKS[destination],
  })),
);

let cache: CorridorMeta[] | null = null;

export function useCorridors() {
  const [corridors, setCorridors] = useState<CorridorMeta[]>(cache ?? FALLBACK_CORRIDORS);
  useEffect(() => {
    if (cache) return;
    let alive = true;
    api
      .corridors()
      .then((list) => {
        const active = list.filter((c) => c.active);
        if (!active.length) return;
        cache = active;
        if (alive) setCorridors(active);
      })
      .catch(() => {
        /* on garde la liste locale */
      });
    return () => {
      alive = false;
    };
  }, []);
  return corridors;
}

/** Moyens de paiement d'un trajet (ancien serveur sans l'info : Interac au Canada + carte). */
export function payMethodsOf(c: CorridorMeta): PayMethod[] {
  return c.payMethods ?? (c.source === "CA" ? ["interac", "card"] : ["card"]);
}

export function findCorridor(list: CorridorMeta[], id: string) {
  return list.find((c) => c.id === id) ?? FALLBACK_CORRIDORS.find((c) => c.id === id) ?? FALLBACK_CORRIDORS[0];
}

/** Montant d'exemple par devise d'envoi. */
export const SAMPLE_AMOUNT: Record<string, number> = { CAD: 200, XAF: 100_000, CNY: 1_000 };

/** Trajet proposé par défaut selon le pays de résidence du client. */
export function defaultCorridorFor(country: string | undefined) {
  if (country === "CM") return "CM-CA";
  if (country === "CN") return "CN-CM";
  return "CA-CM";
}
