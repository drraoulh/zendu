import { Alert, Platform, View } from "react-native";
import { Flag } from "@/components/flag";
import { Card, Empty, H1, Header, IconButton, ListItem, P, Screen } from "@/components/ui";
import { countryName, networkLabel } from "@/lib/format";
import { useStore, type Recipient } from "@/lib/store";
import { colors } from "@/lib/theme";

export default function Recipients() {
  const { recipients, removeRecipient } = useStore();

  function remove(r: Recipient) {
    if (Platform.OS === "web") return removeRecipient(r.id);
    Alert.alert("Supprimer ce bénéficiaire ?", r.fullName, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => removeRecipient(r.id) },
    ]);
  }

  return (
    <Screen>
      <Header title="Bénéficiaires" />
      <H1>Mes bénéficiaires</H1>
      <P style={{ marginTop: 6, marginBottom: 18 }}>Enregistrés sur cet appareil pour envoyer plus vite.</P>
      <Card style={{ paddingVertical: 6 }}>
        {recipients.length ? (
          recipients.map((r) => (
            <ListItem
              key={r.id}
              title={r.fullName}
              subtitle={`${countryName(r.country)} · ${networkLabel(r.network)}`}
              leading={
                <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
                  <Flag code={r.country} size={24} />
                </View>
              }
              right={<IconButton name="close" label={`Supprimer ${r.fullName}`} tone="danger" onPress={() => remove(r)} />}
            />
          ))
        ) : (
          <Empty icon="user" title="Aucun bénéficiaire" text="Ils sont ajoutés automatiquement lors de votre premier envoi." />
        )}
      </Card>
    </Screen>
  );
}
