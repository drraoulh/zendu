import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { ConfirmDialog, SectionTitle } from "@/components/form";
import { Badge, Button, Card, Header, IconButton, ListItem, Notice, Screen } from "@/components/ui";
import { cardLabel } from "@/lib/cards";
import { payMethodsOf, useCorridors } from "@/lib/corridors";
import { useStore, type SavedCard } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";
import { cardLogoId, PaymentLogo } from "@/components/payment-logo";

/**
 * Moyens de paiement : le virement Interac (envois depuis le Canada) passe en premier.
 * La carte de débit n'existe qu'en démonstration (aucun prestataire réel) : elle n'est proposée
 * que si le serveur l'ouvre sur au moins un trajet.
 */
export default function PaymentMethods() {
  const { cards, removeCard, setDefaultCard } = useStore();
  const corridors = useCorridors();
  const [toRemove, setToRemove] = useState<SavedCard | null>(null);
  const def = cards.find((c) => c.isDefault);
  const interacOpen = corridors.some((c) => c.source === "CA" && payMethodsOf(c).includes("interac"));
  const cardsOpen = corridors.some((c) => payMethodsOf(c).includes("card"));

  return (
    <Screen footer={cardsOpen ? <Button title="Ajouter une carte de débit" icon="plus" variant="secondary" onPress={() => router.push("/account/add-card")} /> : undefined}>
      <Header title="Moyens de paiement" />

      <SectionTitle>Envois depuis le Canada</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <ListItem
          leading={<PaymentLogo id="INTERAC" size={28} />}
          title="Virement Interac"
          subtitle="Depuis votre banque canadienne, le moins cher. Rien à enregistrer : les instructions s'affichent au moment de payer."
          subtitleLines={4}
          // Badge sous le texte : à droite, il écrasait la description sur petit écran (360 px).
          extra={
            <View style={{ marginTop: 6 }}>
              <Badge label={interacOpen ? "Recommandé" : "Bientôt"} tone={interacOpen ? "success" : "neutral"} />
            </View>
          }
          right={<View />}
        />
      </Card>

      <SectionTitle>Cartes de débit</SectionTitle>
      {cardsOpen && def ? (
        <View style={{ backgroundColor: colors.navy, borderRadius: 22, padding: 20, gap: 14, marginBottom: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <PaymentLogo id={cardLogoId(def.brand)} size={28} />
            <Badge label="Par défaut" tone="brand" />
          </View>
          <Text style={{ color: colors.white, fontFamily: fonts.heading, fontSize: 20, letterSpacing: 1.5 }} numberOfLines={1} adjustsFontSizeToFit>
            •••• •••• •••• {def.last4}
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, flex: 1 }} numberOfLines={1}>
              {def.holder.toUpperCase()}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>Exp. {def.exp}</Text>
          </View>
        </View>
      ) : null}
      {cards.length ? (
        <Card style={{ paddingVertical: 4, marginBottom: 12 }}>
          {cards.map((c) => (
            <ListItem
              key={c.id}
              leading={<PaymentLogo id={cardLogoId(c.brand)} size={28} />}
              title={cardLabel(c)}
              subtitle={`Expire ${c.exp}${c.isDefault ? " · par défaut" : ""}`}
              onPress={c.isDefault || !cardsOpen ? undefined : () => setDefaultCard(c.id)}
              right={<IconButton name="close" label={`Retirer ${cardLabel(c)}`} tone="danger" onPress={() => setToRemove(c)} />}
            />
          ))}
        </Card>
      ) : null}
      {cardsOpen ? (
        <View style={{ gap: 10 }}>
          {cards.length > 1 ? <Notice tone="neutral" icon="info" text="Touchez une carte pour en faire la carte par défaut." /> : null}
          <Notice
            tone="warn"
            icon="info"
            title="Version de démonstration"
            text="Visa Débit ou Mastercard Débit uniquement (cartes de crédit refusées). Aucune carte n'est débitée en démonstration."
          />
          <Notice tone="brand" icon="lock" text="Seuls la marque, les 4 derniers chiffres et la date d'expiration sont conservés, jamais le numéro complet." />
        </View>
      ) : (
        <Notice tone="neutral" icon="info" text="Le paiement par carte n'est pas encore disponible. Payez vos envois par virement Interac." />
      )}

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
