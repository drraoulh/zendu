import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Share, StyleSheet, Text, View } from "react-native";
import { PoweredBy, WstWordmark } from "@/components/brand";
import { Badge, Button, Card, Divider, Header, Screen, Small, SummaryRow } from "@/components/ui";
import { api, type Transfer } from "@/lib/api";
import { countryName, dateTime, money, networkLabel, phone, rate, statusInfo } from "@/lib/format";
import { openSite } from "@/lib/links";
import { colors, fonts } from "@/lib/theme";

export default function Receipt() {
  const { id, card } = useLocalSearchParams<{ id: string; card?: string }>();
  const [t, setT] = useState<Transfer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.transfer(id).then(setT).catch((e: Error) => setError(e.message));
  }, [id]);

  if (!t) {
    return (
      <Screen>
        <Header title="Reçu" />
        {error ? <Small>{error}</Small> : <ActivityIndicator color={colors.brand} style={{ marginTop: 80 }} />}
      </Screen>
    );
  }

  const info = statusInfo(t.status);
  const ben = t.beneficiary;
  const benLine = [networkLabel(ben.network), ben.accountMasked ?? (ben.phone ? phone(ben.phone) : null)].filter(Boolean).join(" · ");

  function text() {
    if (!t) return "";
    return [
      "Reçu WorldSoft Transfer — une solution PWFINTECH",
      `Référence : ${t.reference}`,
      `Date : ${dateTime(t.createdAt)}`,
      `Statut : ${info.label}`,
      `Expéditeur : ${t.senderName} (${t.senderEmail}) — ${countryName(t.sourceCountry)}`,
      `Destinataire : ${ben.fullName} — ${benLine} — ${countryName(t.destCountry)}`,
      `Montant envoyé : ${money(t.sendAmountCad, t.sendCurrency)}`,
      `Frais : ${money(t.feeCad, t.sendCurrency)}`,
      `Total payé : ${money(t.totalCad, t.sendCurrency)}`,
      `Taux : 1 ${t.sendCurrency} = ${rate(t.rate)} ${t.receiveCurrency}`,
      `Montant reçu : ${money(t.receiveAmountXaf, t.receiveCurrency)}`,
    ].join("\n");
  }

  return (
    <Screen
      footer={
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button title="Version PDF" variant="secondary" style={{ flex: 1 }} onPress={() => openSite(`/transfers/${t.id}/receipt`)} />
          <Button title="Partager" icon="send" style={{ flex: 1 }} onPress={() => Share.share({ message: text() })} />
        </View>
      }
    >
      <Header title="Reçu" />
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <WstWordmark size={24} />
          <Badge label={info.label} tone={info.tone} />
        </View>
        <Text style={r.amount}>{money(t.receiveAmountXaf, t.receiveCurrency)}</Text>
        <Small>{dateTime(t.createdAt)}</Small>
        <Divider />
        <Text style={r.section}>EXPÉDITEUR</Text>
        <Text style={r.name}>{t.senderName}</Text>
        <Small>
          {t.senderEmail} · {countryName(t.sourceCountry)}
        </Small>
        <Text style={[r.section, { marginTop: 12 }]}>DESTINATAIRE</Text>
        <Text style={r.name}>{ben.fullName}</Text>
        <Small>
          {benLine} · {countryName(t.destCountry)}
        </Small>
        <Divider />
        <SummaryRow label="Montant envoyé" value={money(t.sendAmountCad, t.sendCurrency)} />
        <SummaryRow label="Frais" value={money(t.feeCad, t.sendCurrency)} />
        <SummaryRow label="Total payé" value={money(t.totalCad, t.sendCurrency)} strong />
        <SummaryRow label="Taux de change" value={`1 ${t.sendCurrency} = ${rate(t.rate)} ${t.receiveCurrency}`} />
        <SummaryRow label="Montant reçu" value={money(t.receiveAmountXaf, t.receiveCurrency)} highlight />
        <Divider />
        <SummaryRow label="Référence" value={t.reference} strong />
        {card ? <SummaryRow label="Mode de paiement" value={card} /> : null}
        <View style={{ alignItems: "center", marginTop: 14 }}>
          <PoweredBy />
        </View>
      </Card>
    </Screen>
  );
}

const r = StyleSheet.create({
  amount: { fontFamily: fonts.display, fontSize: 30, color: colors.navy, marginTop: 16 },
  section: { fontFamily: fonts.heading, fontSize: 11, letterSpacing: 0.8, color: colors.muted, marginBottom: 2 },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
});
