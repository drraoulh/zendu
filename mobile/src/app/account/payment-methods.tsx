import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { ConfirmDialog, SectionTitle } from "@/components/form";
import { Badge, Button, Card, Empty, Header, IconButton, ListItem, Notice, Screen } from "@/components/ui";
import { cardLabel } from "@/lib/cards";
import { useStore, type SavedCard } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";

export default function PaymentMethods() {
  const { cards, removeCard, setDefaultCard } = useStore();
  const [toRemove, setToRemove] = useState<SavedCard | null>(null);
  const def = cards.find((c) => c.isDefault);

  return (
    <Screen footer={<Button title="Ajouter une carte" icon="plus" onPress={() => router.push("/account/add-card")} />}>
      <Header title="Moyens de paiement" />
      {def ? (
        <View style={{ backgroundColor: colors.navy, borderRadius: 22, padding: 20, gap: 14, marginBottom: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: colors.sky, fontFamily: fonts.heading }}>{def.brand.toUpperCase()}</Text>
            <Badge label="Par défaut" tone="brand" />
          </View>
          <Text style={{ color: colors.white, fontFamily: fonts.heading, fontSize: 20, letterSpacing: 1.5 }}>•••• •••• •••• {def.last4}</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>{def.holder.toUpperCase()}</Text>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>Exp. {def.exp}</Text>
          </View>
        </View>
      ) : null}
      <SectionTitle>Cartes enregistrées</SectionTitle>
      <Card style={{ paddingVertical: 4, marginBottom: 12 }}>
        {cards.length ? (
          cards.map((c) => (
            <ListItem
              key={c.id}
              icon="wallet"
              title={cardLabel(c)}
              subtitle={`Expire ${c.exp}${c.isDefault ? " · par défaut" : ""}`}
              onPress={c.isDefault ? undefined : () => setDefaultCard(c.id)}
              right={<IconButton name="close" label={`Retirer ${cardLabel(c)}`} tone="danger" onPress={() => setToRemove(c)} />}
            />
          ))
        ) : (
          <Empty icon="wallet" title="Aucune carte" text="Ajoutez une carte Visa ou Mastercard pour payer vos transferts." />
        )}
        <ListItem icon="bank" tone="neutral" title="Virement Interac" subtitle="Paiement depuis votre banque canadienne" right={<Badge label="Bientôt" />} />
      </Card>
      {cards.length > 1 ? <Notice tone="neutral" icon="info" text="Touchez une carte pour en faire la carte par défaut." /> : null}
      <View style={{ marginTop: 10 }}>
        <Notice tone="brand" icon="lock" text="Seuls les 4 derniers chiffres sont conservés. WorldSoft Transfer n'affiche ni ne stocke jamais le numéro complet." />
      </View>
      <ConfirmDialog
        visible={toRemove != null}
        title="Retirer cette carte ?"
        message={toRemove ? `${cardLabel(toRemove)} ne sera plus proposée au paiement.` : ""}
        confirmLabel="Retirer"
        destructive
        onCancel={() => setToRemove(null)}
        onConfirm={() => {
          if (toRemove) removeCard(toRemove.id);
          setToRemove(null);
        }}
      />
    </Screen>
  );
}
