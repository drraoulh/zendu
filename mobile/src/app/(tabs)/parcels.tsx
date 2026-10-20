import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Icon } from "@/components/icons";
import { Badge, Button, Card, Field, H1, ListItem, Notice, P, Screen, Small, SummaryRow } from "@/components/ui";
import { api, type Shipment } from "@/lib/api";
import { dateTime } from "@/lib/format";
import { storage } from "@/lib/storage";
import { colors, fonts } from "@/lib/theme";
import { tr } from "@/lib/i18n";

const STATUS: Record<string, { label: string; tone: "brand" | "success" | "warn" | "danger" }> = {
  received: { label: tr("Colis reçu"), tone: "brand" },
  in_transit: { label: tr("En transit"), tone: "brand" },
  customs: { label: tr("Dédouanement"), tone: "warn" },
  out_for_delivery: { label: tr("En livraison"), tone: "brand" },
  delivered: { label: tr("Livré"), tone: "success" },
  exception: { label: tr("Incident"), tone: "danger" },
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

  // Lien direct avec un numéro (…/parcels?number=PWS-…) : suivi lancé tout de suite.
  const linked = params.number;
  useEffect(() => {
    if (linked) void search(linked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linked]);

  async function search(value = number) {
    setError(null);
    const clean = value.trim().toUpperCase();
    if (!clean) return setError(tr("Saisissez votre numéro de suivi (PWS-…)"));
    setNumber(clean);
    setBusy(true);
    try {
      const found = (await api.trackShipment(clean)).shipment;
      setShipment(found);
      // Liste relue sur l'appareil : la recherche peut partir avant le chargement des numéros récents.
      const saved = (await storage.get<string[]>(KEY_RECENT)) ?? [];
      const next = [found.number, ...saved.filter((n) => n !== found.number)].slice(0, 5);
      setRecent(next);
      void storage.set(KEY_RECENT, next);
    } catch (e) {
      setShipment(null);
      setError(e instanceof Error ? e.message : tr("Colis introuvable"));
    } finally {
      setBusy(false);
    }
  }

  const st = shipment ? (STATUS[shipment.status] ?? { label: shipment.status, tone: "brand" as const }) : null;
  const reached = shipment ? ORDER.indexOf(shipment.status) : -1;

  return (
    <Screen edges={["top"]}>
      <H1 style={{ marginTop: 8 }}>{tr("Suivi de colis")}</H1>
      <P style={{ marginTop: 6, marginBottom: 18 }}>{tr("Saisissez le numéro de suivi indiqué sur votre reçu d'expédition PWFINTECH.")}</P>
      <Field
        label={tr("Numéro de suivi")}
        value={number}
        onChangeText={setNumber}
        placeholder="PWS-12345"
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={() => search()}
      />
      <Button title={tr("Suivre")} icon="ship" onPress={() => search()} loading={busy} />
      {error ? (
        <View style={{ marginTop: 12 }}>
          <Notice tone="danger" icon="alert" text={error} />
        </View>
      ) : null}

      {!shipment && recent.length ? (
        <Card style={{ paddingVertical: 4, marginTop: 16 }}>
          <Small style={{ paddingHorizontal: 4, paddingTop: 8 }}>{tr("RECHERCHES RÉCENTES")}</Small>
          {recent.map((n) => (
            <ListItem key={n} icon="ship" title={n} onPress={() => search(n)} />
          ))}
        </Card>
      ) : null}

      {!shipment && !recent.length ? (
        <Card style={{ marginTop: 16, flexDirection: "row", gap: 12, alignItems: "center" }} onPress={() => router.push({ pathname: "/help/[slug]", params: { slug: "suivi-colis" } })}>
          <Icon name="help" color={colors.brand} size={20} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.heading, color: colors.ink }}>{tr("Où trouver mon numéro ?")}</Text>
            <Small>{tr("Il commence par PWS- et figure sur votre reçu d'expédition. Il peut apparaître quelques heures après le dépôt.")}</Small>
          </View>
          <Icon name="chev" color={colors.muted} size={18} />
        </Card>
      ) : null}

      {shipment && st ? (
        <>
          <Card style={{ marginTop: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <View style={{ flexShrink: 1 }}>
                <Small>{tr("N° DE SUIVI")}</Small>
                <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.navy }} numberOfLines={1} adjustsFontSizeToFit>
                  {shipment.number}
                </Text>
              </View>
              <Badge label={tr(st.label)} tone={st.tone} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 }}>
              <Text style={{ fontFamily: fonts.heading, color: colors.ink, flex: 1 }} numberOfLines={2}>{shipment.origin}</Text>
              <Icon name={shipment.mode === "sea" ? "ship" : "send"} color={colors.brand} />
              <Text style={{ fontFamily: fonts.heading, color: colors.ink, flex: 1, textAlign: "right" }} numberOfLines={2}>{shipment.destination}</Text>
            </View>
            <Small style={{ marginTop: 6 }}>
              {shipment.mode === "sea" ? tr("Maritime") : tr("Aérien")}
              {shipment.estimatedDelivery ? tr(" · livraison estimée le {0}", shipment.estimatedDelivery.split("-").reverse().join("/")) : ""}
            </Small>
          </Card>
          <Card style={{ marginBottom: 12 }}>
            {shipment.events.length
              ? [...shipment.events].reverse().map((e, i) => (
                  <View key={`${e.at}${i}`} style={{ flexDirection: "row", gap: 12, paddingVertical: 8 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, marginTop: 4, backgroundColor: i === 0 ? colors.brand : colors.silver }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.semibold, color: colors.ink }}>{tr(e.label)}</Text>
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
                    <Text style={{ fontFamily: fonts.semibold, color: i <= reached ? colors.ink : colors.muted }}>{tr(STATUS[s].label)}</Text>
                  </View>
                ))}
          </Card>
          {shipment.status === "exception" ? (
            <View style={{ gap: 10, marginBottom: 12 }}>
              <Notice tone="danger" icon="alert" text={tr("Un incident bloque ce colis. Notre équipe logistique vous contacte ; vous pouvez aussi nous écrire avec le numéro de suivi.")} />
              <Button title={tr("Contacter le support")} icon="mail" variant="secondary" onPress={() => router.push({ pathname: "/help/contact", params: { subject: tr("Colis {0}", shipment.number) } })} />
            </View>
          ) : null}
          {shipment.weightKg ? (
            <Card>
              <SummaryRow label={tr("Poids")} value={`${shipment.weightKg} kg`} />
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
