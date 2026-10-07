import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Flag } from "@/components/flag";
import { Avatar, ConfirmDialog, SectionTitle } from "@/components/form";
import { TransferRow } from "@/components/transfer-row";
import { Button, Card, Empty, Header, Screen, Small, SummaryRow } from "@/components/ui";
import { countryName, money, networkLabel } from "@/lib/format";
import { useStore } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";
import { useMyTransfers } from "@/lib/use-transfers";
import { corridorFor, recipientDetail } from "@/lib/recipients";
import { useSession } from "@/lib/session";
import { PaymentLogo } from "@/components/payment-logo";

export default function RecipientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recipients, removeRecipient, setDraft } = useStore();
  const { profile } = useSession();
  const { items } = useMyTransfers();
  const [confirm, setConfirm] = useState(false);
  const r = recipients.find((x) => x.id === id);

  if (!r) {
    return (
      <Screen>
        <Header title="Destinataire" />
        <Empty icon="user" title="Destinataire introuvable" text="Il a peut-être été supprimé." />
      </Screen>
    );
  }

  const name = r.fullName.toLowerCase();
  const sent = items.filter((t) => t.beneficiary.fullName.toLowerCase() === name && t.destCountry === r.country);
  const totals = sent.reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.sendCurrency]: (acc[t.sendCurrency] ?? 0) + t.totalCad }), {});

  function send() {
    if (!r) return;
    setDraft({ recipient: r, corridorId: corridorFor(profile?.country ?? "CA", r), quote: null });
    router.push("/(tabs)");
  }

  return (
    <Screen
      footer={
        <View style={{ gap: 8 }}>
          <Button title="Envoyer de l'argent" icon="send" onPress={send} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button title="Modifier" variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => router.push({ pathname: "/recipients/new", params: { id: r.id } })} />
            <Button title="Supprimer" variant="danger" size="sm" style={{ flex: 1 }} onPress={() => setConfirm(true)} />
          </View>
        </View>
      }
    >
      <Header title="Destinataire" />
      <View style={{ alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Avatar name={r.fullName} size={72} />
        <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.navy }}>{r.fullName}</Text>
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          <Flag code={r.country} size={18} />
          <Small>
            {countryName(r.country)}
            {r.relation ? ` · ${r.relation}` : ""}
          </Small>
        </View>
      </View>
      <Card style={{ marginBottom: 12 }}>
        <SummaryRow label="Mode de réception" value={networkLabel(r.network)} valueIcon={<PaymentLogo id={r.network} size={20} />} />
        {r.network === "BANK" && r.bankName ? <SummaryRow label="Banque" value={r.bankName} /> : null}
        <SummaryRow label={r.network === "BANK" ? "Compte" : "Numéro"} value={recipientDetail(r) || "—"} />
        <SummaryRow label="Envois" value={String(sent.length)} />
        {Object.entries(totals).map(([cur, v]) => (
          <SummaryRow key={cur} label="Total envoyé" value={money(v, cur)} strong />
        ))}
      </Card>
      <SectionTitle>Derniers envois</SectionTitle>
      <Card style={{ paddingVertical: 6 }}>
        {sent.length ? sent.slice(0, 5).map((t) => <TransferRow key={t.id} transfer={t} />) : <Small style={{ padding: 12 }}>Aucun envoi pour l&apos;instant.</Small>}
      </Card>
      <ConfirmDialog
        visible={confirm}
        title="Supprimer ce destinataire ?"
        message={`${r.fullName} sera retiré de vos destinataires. Vos transferts passés restent dans l'historique.`}
        confirmLabel="Supprimer"
        destructive
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          removeRecipient(r.id);
          router.back();
        }}
      />
    </Screen>
  );
}
