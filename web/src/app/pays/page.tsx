import type { Metadata } from "next";
import { CountriesContent } from "@/components/info/countries-content";
import { countryCodes, getCountryInfo, type CountryInfo } from "@/components/info/destinations";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Nos pays : Canada, Cameroun, Chine",
  description:
    "WorldSoft Transfer relie le Canada, le Cameroun et la Chine dans les deux sens : mobile money, Interac, Alipay, WeChat Pay ou compte bancaire. Devises, délais et frais.",
  alternates: { canonical: "/pays" },
};

export default async function Page() {
  const countries = (await Promise.all(countryCodes().map((c) => getCountryInfo(c)))).filter(
    (c): c is CountryInfo => c !== null,
  );
  return <CountriesContent countries={countries} />;
}
