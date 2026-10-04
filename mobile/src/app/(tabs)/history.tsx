import { router } from "expo-router";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransferRow } from "@/components/transfer-row";
import { Button, Card, Empty, H1, Notice, P, Small } from "@/components/ui";
import { colors } from "@/lib/theme";
import { useMyTransfers } from "@/lib/use-transfers";

export default function History() {
  const { items, loading, failed, reload, count } = useMyTransfers();

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={loading && count > 0} onRefresh={reload} tintColor={colors.brand} />}
      >
        <H1>Historique</H1>
        <P style={{ marginTop: 6, marginBottom: 18 }}>Suivez vos transferts en temps réel. Tirez vers le bas pour actualiser.</P>
        {failed ? (
          <View style={{ marginBottom: 12 }}>
            <Notice tone="danger" icon="alert" text="Impossible de charger vos transferts. Vérifiez votre connexion." />
          </View>
        ) : null}
        <Card style={{ paddingVertical: 6 }}>
          {items.length ? (
            items.map((t) => <TransferRow key={t.id} transfer={t} />)
          ) : loading && count > 0 ? (
            <Small style={{ padding: 12 }}>Chargement…</Small>
          ) : (
            <Empty
              icon="history"
              title="Aucun transfert"
              text="Les transferts effectués depuis cet appareil apparaîtront ici."
              action={<Button title="Envoyer de l'argent" size="sm" onPress={() => router.push("/(tabs)/send")} />}
            />
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
