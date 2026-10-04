import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { CardForm } from "@/components/card-form";
import { Button, Card, Choice, H2, Header, Notice, Screen, Small } from "@/components/ui";
import { cardLabel } from "@/lib/cards";
import { money } from "@/lib/format";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";

export default function Pay() {
  const { profile } = useSession();
  const { draft, setDraft, cards, saveCard } = useStore();
  const [selected, setSelected] = useState<string | null>(draft.cardId ?? cards.find((c) => c.isDefault)?.id ?? cards[0]?.id ?? null);
  const [adding, setAdding] = useState(cards.length === 0);
  const quote = draft.quote;

  if (!draft.recipient || !quote) return <Redirect href="/(tabs)/send" />;

  function pay(cardId: string) {
    setDraft({ cardId });
    router.push("/send/processing");
  }

  return (
    <Screen
      footer={
        !adding ? (
          <View style={{ gap: 6 }}>
            <Button title={`Payer ${money(quote.total, quote.sendCurrency)}`} icon="lock" onPress={() => selected && pay(selected)} disabled={!selected} />
            <Small style={{ textAlign: "center" }}>Paiement protégé par 3-D Secure</Small>
          </View>
        ) : undefined
      }
    >
      <Header title="Paiement par carte" />
      <Card style={{ marginBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Small>TOTAL À PAYER</Small>
          <Text style={{ fontFamily: fonts.display, fontSize: 26, color: colors.navy }}>{money(quote.total, quote.sendCurrency)}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Small>{draft.recipient.fullName} reçoit</Small>
          <Text style={{ fontFamily: fonts.heading, color: colors.brand }}>{money(quote.receiveAmount, quote.receiveCurrency)}</Text>
        </View>
      </Card>

      {!adding ? (
        <>
          <H2 style={{ fontSize: 17, marginBottom: 10 }}>Carte enregistrée</H2>
          {cards.map((c) => (
            <Choice key={c.id} icon="wallet" label={cardLabel(c)} description={`Expire ${c.exp} · ${c.holder}`} selected={selected === c.id} onPress={() => setSelected(c.id)} />
          ))}
          <Button title="Ajouter une nouvelle carte" icon="plus" variant="secondary" onPress={() => setAdding(true)} />
        </>
      ) : (
        <>
          <H2 style={{ fontSize: 17, marginBottom: 10 }}>Nouvelle carte</H2>
          <CardForm
            defaultHolder={profile ? `${profile.firstName} ${profile.lastName}` : ""}
            submitLabel={`Payer ${money(quote.total, quote.sendCurrency)}`}
            onSubmit={(c) => pay(saveCard(c).id)}
          />
          {cards.length ? <Button title="Utiliser une carte enregistrée" variant="ghost" onPress={() => setAdding(false)} style={{ marginTop: 6 }} /> : null}
        </>
      )}
      <View style={{ marginTop: 14 }}>
        <Notice
          tone="neutral"
          icon="info"
          text="Version de démonstration : aucune carte n'est débitée. Avec Stripe activé sur le serveur, le paiement se fait sur la page sécurisée de Stripe."
        />
      </View>
    </Screen>
  );
}
