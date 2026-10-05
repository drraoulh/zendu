import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Icon } from "@/components/icons";
import { Badge, Button, Card, Field, H1, ListItem, Notice, P, Screen, Small, SummaryRow } from "@/components/ui";
import { api, type Shipment } from "@/lib/api";
import { dateTime } from "@/lib/format";
import { storage } from "@/lib/storage";
import { colors, fonts } from "@/lib/theme";

const STATUS: Record<string, { label: string; tone: "brand" | "success" | "warn" | "danger" }> = {
  received: { label: "Colis reçu", tone: "brand" },
  in_transit: { label: "En transit", tone: "brand" },
  customs: { label: "Dédouanement", tone: "warn" },
  out_for_delivery: { label: "En livraison", tone: "brand" },
  delivered: { label: "Livré", tone: "success" },
  exception: { label: "Incident", tone: "danger" },
};

const ORDER = ["received", "in_transit", "customs", "out_for_delivery", "delivered"];

const KEY_RECENT = "wst.parcels";

/** Onglet Colis : suivi d'un envoi Shipping par son numéro (PWS-…), numéros récents mémorisés. */
export default function Parcels() {
  const params = useLocalSearchParams<{ number?: string }>();
  const [number, setNumber] = useState(params.number ?? "");
  const [recent, setRecent] = useState<string[]>([]);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void storage.get<string[]>(KEY_RECENT).then((l) => setRecent(l ?? []));
  }, []);

  async function search(value = number) {
    setError(null);
    if (!value.trim()) return setError("Saisissez votre numéro de suivi (PWS-…)");
    setNumber(value);
    setBusy(true);
    try {
      const found = (await api.trackShipment(value.trim())).shipment;
      setShipment(found);
      const next = [found.number, ...recent.filter((n) => n !== found.number)].slice(0, 5);
      setRecent(next);
      void storage.set(KEY_RECENT, next);
    } catch (e) {
      setShipment(null);
      setError(e instanceof Error ? e.message : "Colis introuvable");
    } finally {
      setBusy(false);
    }
  }

  const st = shipment ? (STATUS[shipment.status] ?? { label: shipment.status, tone: "brand" as const }) : null;
  const reached = shipment ? ORDER.indexOf(shipment.status) : -1;

  return (
    <Screen edges={["top"]}>
      <H1 style={{ marginTop: 8 }}>Suivi de colis</H1>
      <P style={{ marginTop: 6, marginBottom: 18 }}>Saisissez le numéro de suivi indiqué sur votre reçu d&apos;expédition PWFINTECH.</P>
      <Field label="Numéro de suivi" value={number} onChangeText={setNumber} placeholder="PWS-12345" autoCapitalize="characters" onSubmitEditing={() => search()} />
      <Button title="Suivre" icon="ship" onPress={() => search()} loading={busy} />
      {error ? (
        <View style={{ marginTop: 12 }}>
          <Notice tone="danger" icon="alert" text={error} />
        </View>
      ) : null}

      {!shipment && recent.length ? (
        <Card style={{ paddingVertical: 4, marginTop: 16 }}>
          <Small style={{ paddingHorizontal: 4, paddingTop: 8 }}>RECHERCHES RÉCENTES</Small>
          {recent.map((n) => (
            <ListItem key={n} icon="ship" title={n} onPress={() => search(n)} />
          ))}
        </Card>
      ) : null}

      {shipment && st ? (
        <>
          <Card style={{ marginTop: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Small>N° DE SUIVI</Small>
                <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.navy }}>{shipment.number}</Text>
              </View>
              <Badge label={st.label} tone={st.tone} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 }}>
              <Text style={{ fontFamily: fonts.heading, color: colors.ink, flex: 1 }} numberOfLines={1}>{shipment.origin}</Text>
              <Icon name={shipment.mode === "sea" ? "ship" : "send"} color={colors.brand} />
              <Text style={{ fontFamily: fonts.heading, color: colors.ink, flex: 1, textAlign: "right" }} numberOfLines={1}>{shipment.destination}</Text>
            </View>
            <Small style={{ marginTop: 6 }}>
              {shipment.mode === "sea" ? "Maritime" : "Aérien"}
              {shipment.estimatedDelivery ? ` · livraison estimée le ${shipment.estimatedDelivery.split("-").reverse().join("/")}` : ""}
            </Small>
          </Card>
          <Card style={{ marginBottom: 12 }}>
            {shipment.events.length
              ? [...shipment.events].reverse().map((e, i) => (
                  <View key={`${e.at}${i}`} style={{ flexDirection: "row", gap: 12, paddingVertical: 8 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, marginTop: 4, backgroundColor: i === 0 ? colors.brand : colors.silver }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.semibold, color: colors.ink }}>{e.label}</Text>
                      <Small>
                        {dateTime(e.at)}
                        {e.location ? ` · ${e.location}` : ""}
                      </Small>
                    </View>
                  </View>
                ))
              : ORDER.map((s, i) => (
                  <View key={s} style={{ flexDirection: "row", gap: 12, paddingVertical: 8 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, marginTop: 4, backgroundColor: i <= reached ? colors.brand : colors.line }} />
                    <Text style={{ fontFamily: fonts.semibold, color: i <= reached ? colors.ink : colors.muted }}>{STATUS[s].label}</Text>
                  </View>
                ))}
          </Card>
          {shipment.weightKg ? (
            <Card>
              <SummaryRow label="Poids" value={`${shipment.weightKg} kg`} />
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
