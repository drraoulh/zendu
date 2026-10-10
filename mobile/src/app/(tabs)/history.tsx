import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chips, SectionTitle } from "@/components/form";
import { TransferRow } from "@/components/transfer-row";
import { Button, Card, Empty, Field, H1, Notice } from "@/components/ui";
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

const MONTH_NAMES = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** Transferts regroupés par mois (« Octobre 2026 »), dans l'ordre de la liste. */
function byMonth(list: Transfer[]) {
  const groups: { label: string; items: Transfer[] }[] = [];
  for (const t of list) {
    const d = new Date(t.createdAt);
    const name = Number.isNaN(d.getTime()) ? "" : `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    const label = name.charAt(0).toUpperCase() + name.slice(1);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(t);
    else groups.push({ label, items: [t] });
  }
  return groups;
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
            <Field label="Rechercher" placeholder="Nom ou référence" value={q} onChangeText={setQ} autoCapitalize="none" />
            <Chips options={FILTERS} value={filter} onChange={setFilter} />
          </>
        ) : null}
        {failed ? (
          <View style={{ marginBottom: 12, gap: 8 }}>
            <Notice
              tone="danger"
              icon="alert"
              text={items.length ? "Impossible d'actualiser vos transferts. La liste affichée peut ne pas être à jour." : "Impossible de charger vos transferts. Vérifiez votre connexion."}
            />
            <Button title="Réessayer" icon="refresh" size="sm" variant="secondary" onPress={reload} loading={loading} />
          </View>
        ) : null}
        {list.length ? (
          byMonth(list).map((g) => (
            <View key={g.label}>
              <SectionTitle>{g.label}</SectionTitle>
              <Card style={{ paddingVertical: 6 }}>
                {g.items.map((t) => (
                  <TransferRow key={t.id} transfer={t} />
                ))}
              </Card>
            </View>
          ))
        ) : failed && !items.length ? null : (
          <Card style={{ paddingVertical: 6 }}>
            {loading && !items.length ? (
              <View style={{ padding: 24, alignItems: "center" }}>
                <ActivityIndicator color={colors.brand} accessibilityLabel="Chargement" />
              </View>
            ) : items.length ? (
              <Empty icon="history" title="Aucun résultat" text="Essayez un autre nom, une autre référence ou un autre filtre." />
            ) : (
              <Empty
                icon="history"
                title="Aucun transfert"
                text="Vos transferts apparaîtront ici, avec leur suivi en temps réel."
                action={<Button title="Envoyer de l'argent" size="sm" onPress={() => router.push("/(tabs)")} />}
              />
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
