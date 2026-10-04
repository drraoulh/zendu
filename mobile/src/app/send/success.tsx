import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View, useWindowDimensions } from "react-native";
import { Icon } from "@/components/icons";
import { Button, Card, H1, P, Screen, Small, SummaryRow } from "@/components/ui";
import { api, type Transfer } from "@/lib/api";
import { findCorridor, useCorridors } from "@/lib/corridors";
import { deliveryEstimate, etaLabel, money, networkLabel } from "@/lib/format";
import { useShare } from "@/lib/share";
import { useStore } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";

export default function Success() {
  const { id, card } = useLocalSearchParams<{ id: string; card?: string }>();
  const { resetDraft } = useStore();
  const [t, setT] = useState<Transfer | null>(null);
  const [failed, setFailed] = useState(false);
  const sharer = useShare();
  const corridors = useCorridors();
  // Écran court (568 px) : trois rangées de boutons masquaient la moitié du récapitulatif ;
  // « Retour à l'accueil » passe alors sous le contenu.
  const short = useWindowDimensions().height < 640;

  useEffect(() => {
    resetDraft();
    void api
      .transfer(id)
      .then(setT)
      .catch(() => setFailed(true));
  }, [id, resetDraft]);

  if (!t) {
    // Paiement déjà accepté : si le détail ne se charge pas, on n'affiche pas un chargement sans fin.
    return (
      <Screen
        footer={
          failed ? (
            <View style={{ gap: 8 }}>
              <Button title="Suivre le transfert" onPress={() => router.replace({ pathname: "/transfer/[id]", params: { id } })} />
              <Button title="Retour à l'accueil" variant="ghost" onPress={() => router.replace("/(tabs)")} />
            </View>
          ) : undefined
        }
      >
        {failed ? (
          <View style={{ alignItems: "center", paddingTop: 60, gap: 10 }}>
            <Icon name="check" color={colors.success} size={42} strokeWidth={2.4} />
            <H1 style={{ textAlign: "center" }}>Paiement réussi</H1>
            <P style={{ textAlign: "center" }}>Le détail du transfert n&apos;a pas pu être chargé. Vous le retrouverez dans votre historique.</P>
          </View>
        ) : (
          <ActivityIndicator style={{ marginTop: 120 }} color={colors.brand} size="large" />
        )}
      </Screen>
    );
  }

  const eta = deliveryEstimate(findCorridor(corridors, t.corridorId).deliveryEstimate, t.beneficiary.network);

  async function share() {
    if (!t) return;
    await sharer.share(
      `WorldSoft Transfer — ${t.beneficiary.fullName} va recevoir ${money(t.receiveAmountXaf, t.receiveCurrency)} (${networkLabel(t.beneficiary.network)}). Référence ${t.reference}.`,
    );
  }

  return (
    <Screen
      footer={
        <View style={{ gap: 8 }}>
          <Button title="Suivre le transfert" onPress={() => router.replace({ pathname: "/transfer/[id]", params: { id: t.id } })} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button title="Voir le reçu" variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => router.push({ pathname: "/receipt/[id]", params: { id: t.id, card: card ?? "" } })} />
            <Button title={sharer.label} icon={sharer.copied ? "check" : "send"} variant="secondary" size="sm" style={{ flex: 1 }} onPress={share} />
          </View>
          {short ? null : <Button title="Retour à l'accueil" variant="ghost" onPress={() => router.replace("/(tabs)")} />}
        </View>
      }
    >
      <View style={{ alignItems: "center", paddingTop: 30, gap: 8 }}>
        <View style={{ width: 84, height: 84, borderRadius: 28, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" }}>
          <Icon name="check" color={colors.success} size={42} strokeWidth={2.4} />
        </View>
        <H1 style={{ textAlign: "center" }}>Paiement réussi</H1>
        <P style={{ textAlign: "center" }}>{t.beneficiary.fullName} recevra</P>
        <Text style={{ fontFamily: fonts.display, fontSize: 32, color: colors.brand }}>{money(t.receiveAmountXaf, t.receiveCurrency)}</Text>
        <Small>via {networkLabel(t.beneficiary.network)}</Small>
      </View>
      <Card style={{ marginTop: 20 }}>
        <SummaryRow label="Référence" value={t.reference} strong />
        <SummaryRow label="Montant payé" value={money(t.totalCad, t.sendCurrency)} />
        <SummaryRow label="Délai estimé" value={etaLabel(eta)} />
        {card ? <SummaryRow label="Payé avec" value={card} /> : null}
      </Card>
      <Small style={{ textAlign: "center", marginTop: 12 }}>Un reçu a été envoyé à {t.senderEmail}.</Small>
      {short ? <Button title="Retour à l'accueil" variant="ghost" style={{ marginTop: 8 }} onPress={() => router.replace("/(tabs)")} /> : null}
    </Screen>
  );
}
