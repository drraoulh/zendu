import { router } from "expo-router";
import { View } from "react-native";
import { Flag } from "@/components/flag";
import { SectionTitle } from "@/components/form";
import { Button, Card, Header, Notice, Screen, Small, SummaryRow } from "@/components/ui";
import { COUNTRY_CODES, useCorridors } from "@/lib/corridors";
import { countryName, money } from "@/lib/format";
import { useSession } from "@/lib/session";

/** « le Canada », « le Cameroun », « la Chine ». */
const withArticle = (code: string) => `${code === "CN" ? "la" : "le"} ${countryName(code)}`;

/** Limites par envoi, lues sur les trajets ouverts (mêmes valeurs que celles appliquées par le serveur). */
export default function Limits() {
  const { profile } = useSession();
  const corridors = useCorridors();
  const kyc = profile?.kyc ?? "none";
  const home = profile?.country;
  const sources = [...COUNTRY_CODES].sort((a, b) => (a === home ? -1 : b === home ? 1 : 0));

  return (
    <Screen>
      <Header title="Limites d'envoi" />
      {kyc !== "verified" ? (
        <View style={{ marginBottom: 14 }}>
          <Notice
            tone="warn"
            icon="shield"
            title={kyc === "pending" ? "Vérification en cours" : "Identité à vérifier"}
            text={kyc === "pending" ? "Vous pourrez envoyer dès que votre identité sera confirmée." : "La vérification d'identité est obligatoire avant votre premier envoi."}
          />
        </View>
      ) : null}
      <Small>Montant minimum et maximum par envoi, selon le pays et la devise de départ. Les frais et le taux sont toujours affichés avant le paiement.</Small>
      {sources.map((source) => {
        const list = corridors.filter((c) => c.source === source);
        if (!list.length) return null;
        const c = list[0];
        return (
          <View key={source}>
            <SectionTitle>{`Depuis ${withArticle(source)}${source === home ? " (vous)" : ""}`}</SectionTitle>
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Flag code={source} size={18} />
                <Small>Vers {list.map((x) => withArticle(x.destination)).join(" ou ")}</Small>
              </View>
              {list.every((x) => x.minSend === c.minSend && x.maxSend === c.maxSend) ? (
                <>
                  <SummaryRow label="Minimum par envoi" value={money(c.minSend, c.sendCurrency)} />
                  <SummaryRow label="Maximum par envoi" value={money(c.maxSend, c.sendCurrency)} strong />
                </>
              ) : (
                list.map((x) => <SummaryRow key={x.id} label={`Vers ${withArticle(x.destination)}`} value={`${money(x.minSend, x.sendCurrency)} à ${money(x.maxSend, x.sendCurrency)}`} />)
              )}
            </Card>
          </View>
        );
      })}
      <Button title="Une question sur les limites ?" variant="ghost" icon="help" style={{ marginTop: 12 }} onPress={() => router.push({ pathname: "/help/[slug]", params: { slug: "limites" } })} />
    </Screen>
  );
}
