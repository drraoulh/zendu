import { Redirect, router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Text, View } from "react-native";
import { CardForm } from "@/components/card-form";
import { Button, Card, Choice, H2, Header, Notice, Screen, Small } from "@/components/ui";
import { cardLabel } from "@/lib/cards";
import { money } from "@/lib/format";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";
import { cardLogoId, PaymentLogo } from "@/components/payment-logo";
import { tr } from "@/lib/i18n";

export default function Pay() {
  const { profile } = useSession();
  const { draft, setDraft, cards, saveCard } = useStore();
  const [selected, setSelected] = useState<string | null>(draft.cardId ?? cards.find((c) => c.isDefault)?.id ?? cards[0]?.id ?? null);
  const [adding, setAdding] = useState(cards.length === 0);
  const quote = draft.quote;
  // Double appui : un seul écran de traitement (donc un seul transfert créé).
  const going = useRef(false);
  useFocusEffect(
    useCallback(() => {
      going.current = false;
    }, []),
  );

  if (!draft.recipient || !quote) return <Redirect href="/(tabs)" />;

  function pay(cardId: string) {
    if (going.current) return;
    going.current = true;
    setDraft({ cardId });
    router.push("/send/processing");
  }

  return (
    <Screen
      footer={
        !adding ? (
          <View style={{ gap: 6 }}>
            <Button title={tr("Payer {0}", money(quote.total, quote.sendCurrency))} icon="lock" onPress={() => selected && pay(selected)} disabled={!selected} />
            <Small style={{ textAlign: "center" }}>{tr("Paiement protégé par 3-D Secure")}</Small>
          </View>
        ) : undefined
      }
    >
      <Header title={tr("Paiement par carte")} />
      <Card style={{ marginBottom: 16 }}>
        <Small>{tr("TOTAL À PAYER")}</Small>
        <Text style={{ fontFamily: fonts.display, fontSize: 26, color: colors.navy }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {money(quote.total, quote.sendCurrency)}
        </Text>
        {/* Bénéficiaire sur sa propre ligne : à côté du total, le bloc passait en dessous, mal aligné (360 px). */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line }}>
          <Small numberOfLines={1} style={{ flex: 1 }}>
            {tr("{0} reçoit", draft.recipient.fullName)}
          </Small>
          <Text style={{ fontFamily: fonts.heading, color: colors.brand }} numberOfLines={1}>
            {money(quote.receiveAmount, quote.receiveCurrency)}
          </Text>
        </View>
      </Card>

      {!adding ? (
        <>
          <H2 style={{ fontFamily: fonts.regular, fontSize: 17, marginBottom: 10 }}>{tr("Carte enregistrée")}</H2>
          {cards.map((c) => (
            <Choice key={c.id} leading={<PaymentLogo id={cardLogoId(c.brand)} size={24} />} label={cardLabel(c)} description={tr("Expire {0} · {1}", c.exp, c.holder)} selected={selected === c.id} onPress={() => setSelected(c.id)} />
          ))}
          <Button title={tr("Ajouter une nouvelle carte")} icon="plus" variant="secondary" onPress={() => setAdding(true)} />
        </>
      ) : (
        <>
          <H2 style={{ fontFamily: fonts.regular, fontSize: 17, marginBottom: 4 }}>{tr("Nouvelle carte de débit")}</H2>
          <Small style={{ marginBottom: 12 }}>{tr("Visa Débit ou Mastercard Débit. Les cartes de crédit ne sont pas acceptées.")}</Small>
          <CardForm
            defaultHolder={profile ? `${profile.firstName} ${profile.lastName}` : ""}
            submitLabel={tr("Payer {0}", money(quote.total, quote.sendCurrency))}
            onSubmit={(c) => pay(saveCard(c).id)}
          />
          {cards.length ? <Button title={tr("Utiliser une carte enregistrée")} variant="ghost" onPress={() => setAdding(false)} style={{ marginTop: 6 }} /> : null}
        </>
      )}
      <View style={{ marginTop: 14 }}>
        <Notice
          tone="neutral"
          icon="info"
          text={tr("Version de démonstration : aucune carte n'est débitée.")}
        />
      </View>
    </Screen>
  );
}
