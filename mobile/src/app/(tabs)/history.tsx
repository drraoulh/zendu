import { router } from "expo-router";
import { useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chips } from "@/components/form";
import { TransferRow } from "@/components/transfer-row";
import { Button, Card, Empty, Field, H1, Notice, Small } from "@/components/ui";
import type { Transfer } from "@/lib/api";
import { countryName, dateTime, money, networkLabel, statusInfo } from "@/lib/format";
import { useShare } from "@/lib/share";
import { colors } from "@/lib/theme";
import { useMyTransfers } from "@/lib/use-transfers";

type Filter = "all" | "progress" | "delivered" | "issue";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "progress", label: "En cours" },
  { value: "delivered", label: "Livrés" },
  { value: "issue", label: "Incidents" },
];

function group(t: Transfer): Filter {
  if (t.status === "delivered") return "delivered";
  if (["payout_failed", "payment_mismatch", "expired", "cancelled"].includes(t.status)) return "issue";
  return "progress";
}

function csv(list: Transfer[]) {
  const head = "Date;Référence;Destinataire;Pays;Mode;Envoyé;Frais;Total;Reçu;Statut";
  const rows = list.map((t) =>
    [
      dateTime(t.createdAt),
      t.reference,
      t.beneficiary.fullName,
      countryName(t.destCountry),
      networkLabel(t.beneficiary.network),
      money(t.sendAmountCad, t.sendCurrency),
      money(t.feeCad, t.sendCurrency),
      money(t.totalCad, t.sendCurrency),
      money(t.receiveAmountXaf, t.receiveCurrency),
      statusInfo(t.status).label,
    ].join(";"),
  );
  return [head, ...rows].join("\n");
}

export default function History() {
  const { items, loading, failed, reload, count } = useMyTransfers();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const exporter = useShare("Exporter");
  const query = q.trim().toLowerCase();
  const list = items.filter(
    (t) => (filter === "all" || group(t) === filter) && (!query || t.beneficiary.fullName.toLowerCase().includes(query) || t.reference.toLowerCase().includes(query)),
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 16 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading && count > 0} onRefresh={reload} tintColor={colors.brand} />}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <H1>Mes transferts</H1>
          {items.length ? <Button title={exporter.label} size="sm" variant="secondary" onPress={() => exporter.share(csv(list), "Historique WorldSoft Transfer")} /> : null}
        </View>
        {items.length ? (
          <>
            <Field label="Rechercher" placeholder="Rechercher un nom ou une référence" value={q} onChangeText={setQ} autoCapitalize="none" />
            <Chips options={FILTERS} value={filter} onChange={setFilter} />
          </>
        ) : null}
        {failed ? (
          <View style={{ marginBottom: 12 }}>
            <Notice tone="danger" icon="alert" text="Impossible de charger vos transferts. Vérifiez votre connexion." />
          </View>
        ) : null}
        <Card style={{ paddingVertical: 6 }}>
          {list.length ? (
            list.map((t) => <TransferRow key={t.id} transfer={t} />)
          ) : loading && !items.length ? (
            <Small style={{ padding: 12 }}>Chargement…</Small>
          ) : items.length ? (
            <Empty icon="history" title="Aucun résultat" text="Essayez un autre nom, une autre référence ou un autre filtre." />
          ) : (
            <Empty
              icon="history"
              title="Aucun transfert"
              text="Vos transferts apparaîtront ici, avec leur suivi en temps réel."
              action={<Button title="Envoyer de l'argent" size="sm" onPress={() => router.push("/(tabs)/send")} />}
            />
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
