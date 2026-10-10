import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { PoweredBy, WstWordmark } from "@/components/brand";
import { Icon } from "@/components/icons";
import { RecipientNotice, recipientMessage } from "@/components/recipient-notice";
import { Button, Header, Notice, Screen, Small } from "@/components/ui";
import { api, type Transfer } from "@/lib/api";
import { countryName, dateTime, feeLabel, money, networkLabel, phone, rate, statusInfo } from "@/lib/format";
import { openSite } from "@/lib/links";
import { shareViewAsImage } from "@/lib/share-image";
import { colors, fonts, radius } from "@/lib/theme";
import { cardLogoId, PaymentLogo } from "@/components/payment-logo";

type Mode = "mine" | "recipient";

export default function Receipt() {
  const params = useLocalSearchParams<{ id: string; card?: string; mode?: Mode }>();
  const [t, setT] = useState<Transfer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(params.mode === "recipient" ? "recipient" : "mine");
  const [copied, setCopied] = useState(false);
  const mineRef = useRef<View>(null);
  const noticeRef = useRef<View>(null);

  const fetchTransfer = useCallback(() => api.transfer(params.id).then(setT).catch((e: Error) => setError(e.message)), [params.id]);
  useEffect(() => {
    void fetchTransfer();
  }, [fetchTransfer]);
  const load = () => {
    setError(null);
    void fetchTransfer();
  };

  if (!t) {
    return (
      <Screen>
        <Header title="Reçu" />
        {error ? (
          <View style={{ gap: 12 }}>
            <Notice tone="danger" icon="alert" text={error} />
            <Button title="Réessayer" icon="refresh" size="sm" variant="secondary" onPress={load} />
          </View>
        ) : (
          <ActivityIndicator color={colors.brand} style={{ marginTop: 80 }} />
        )}
      </Screen>
    );
  }

  const info = statusInfo(t.status);
  const ben = t.beneficiary;
  const first = ben.fullName.split(" ")[0];
  const deliveredAt = t.events?.find((e) => e.type === "delivered")?.createdAt;
  // Moyen de paiement : celui choisi pendant l'envoi (carte précise) ou, à défaut, celui du transfert.
  const paidWith = params.card ?? ({ interac_manual: "Virement Interac", interac: "Virement Interac", stripe: "Carte de débit" } as Record<string, string>)[t.payInProvider];
  const benLine = [networkLabel(ben.network), ben.accountMasked ?? (ben.phone ? phone(ben.phone) : null)].filter(Boolean).join(" · ");

  function receiptText() {
    if (!t) return "";
    return [
      "Reçu WorldSoft Transfer — une solution PWFINTECH",
      `Référence : ${t.reference}`,
      `Date : ${dateTime(t.createdAt)}`,
      `Statut : ${info.label}`,
      `Expéditeur : ${t.senderName} — ${countryName(t.sourceCountry)}`,
      `Destinataire : ${ben.fullName} — ${benLine} — ${countryName(t.destCountry)}`,
      `Montant envoyé : ${money(t.sendAmountCad, t.sendCurrency)}`,
      `Frais : ${feeLabel(t.feeCad, t.sendCurrency)}`,
      `Total payé : ${money(t.totalCad, t.sendCurrency)}`,
      `Taux : 1 ${t.sendCurrency} = ${rate(t.rate)} ${t.receiveCurrency}`,
      `Montant reçu : ${money(t.receiveAmountXaf, t.receiveCurrency)}`,
      ...(paidWith ? [`Payé avec : ${paidWith}`] : []),
      ...(deliveredAt ? [`Livré le : ${dateTime(deliveredAt)}`] : []),
    ].join("\n");
  }

  async function share() {
    if (!t) return;
    const r =
      mode === "recipient"
        ? await shareViewAsImage(noticeRef, recipientMessage(t), `Prévenir ${first}`)
        : await shareViewAsImage(mineRef, receiptText(), "Reçu WorldSoft Transfer");
    if (r === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Screen
      footer={
        mode === "recipient" ? (
          <View style={{ gap: 6 }}>
            <Button title={copied ? "Message copié" : `Envoyer à ${first}`} icon={copied ? "check" : "send"} onPress={share} />
            <Small style={{ textAlign: "center" }}>Par WhatsApp, SMS ou courriel · sans frais ni données de paiement</Small>
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button title="Reçu PDF" variant="secondary" style={{ flex: 1 }} onPress={() => openSite(`/transfers/${t.id}/receipt`)} />
            <Button title={copied ? "Copié" : "Partager"} icon={copied ? "check" : "send"} style={{ flex: 1 }} onPress={share} />
          </View>
        )
      }
    >
      <Header title="Reçu" />
      <View style={r.tabs} accessibilityRole="tablist">
        {(
          [
            ["mine", "Mon reçu"],
            ["recipient", `Pour ${first}`],
          ] as const
        ).map(([m, label]) => (
          <Pressable
            key={m}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === m }}
            onPress={() => setMode(m)}
            style={[r.tab, mode === m && r.tabOn]}
          >
            <Text style={[r.tabText, mode === m && { color: colors.white }]} numberOfLines={1}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {mode === "recipient" ? (
        <>
          <Small style={{ marginBottom: 12 }}>
            Envoyez cet avis à {first} pour l&apos;informer de votre envoi. Il ne contient ni vos frais ni votre moyen de paiement.
          </Small>
          <View ref={noticeRef} collapsable={false}>
            <RecipientNotice transfer={t} />
          </View>
        </>
      ) : (
        <View ref={mineRef} collapsable={false} style={r.card}>
          <View style={r.head}>
            <View style={r.headTop}>
              <WstWordmark size={22} negative />
              <View style={[r.badge, { backgroundColor: info.tone === "success" ? colors.success : info.tone === "danger" ? colors.danger : "rgba(255,255,255,0.16)" }]}>
                <Text style={r.badgeText}>{info.label}</Text>
              </View>
            </View>
            <Text style={r.headLabel}>{ben.fullName} reçoit</Text>
            <Text style={r.amount}>{money(t.receiveAmountXaf, t.receiveCurrency)}</Text>
            <Text style={r.headMeta}>{dateTime(t.createdAt)}</Text>
          </View>
          <View style={r.body}>
            <Party label="Expéditeur" name={t.senderName} line={`${t.senderEmail} · ${countryName(t.sourceCountry)}`} />
            <Party label="Destinataire" name={ben.fullName} line={`${benLine} · ${countryName(t.destCountry)}`} logo={ben.network} />
            <View style={r.sep} />
            <Line label="Montant envoyé" value={money(t.sendAmountCad, t.sendCurrency)} />
            <Line label="Frais" value={feeLabel(t.feeCad, t.sendCurrency)} />
            <Line label="Taux de change" value={`1 ${t.sendCurrency} = ${rate(t.rate)} ${t.receiveCurrency}`} />
            <Line label="Total payé" value={money(t.totalCad, t.sendCurrency)} strong />
            <View style={r.sep} />
            <Line label="Référence" value={t.reference} strong />
            {paidWith ? (
              <Line label="Payé avec" value={paidWith} logo={paidWith.startsWith("Virement Interac") ? "INTERAC" : cardLogoId((params.card ?? "").split(" ")[0])} />
            ) : null}
            {deliveredAt ? <Line label="Livré le" value={dateTime(deliveredAt)} /> : null}
          </View>
          <View style={r.foot}>
            <Icon name="shield" color={colors.muted} size={14} />
            <PoweredBy />
          </View>
        </View>
      )}
    </Screen>
  );
}

function Party({ label, name, line, logo }: { label: string; name: string; line: string; logo?: string }) {
  return (
    <View style={{ marginBottom: 12, flexDirection: "row", gap: 12, alignItems: "center" }}>
      <View style={{ flex: 1 }}>
        <Text style={r.section}>{label.toUpperCase()}</Text>
        <Text style={r.name}>{name}</Text>
        <Small>{line}</Small>
      </View>
      {logo ? <PaymentLogo id={logo} size={26} /> : null}
    </View>
  );
}

function Line({ label, value, strong = false, logo }: { label: string; value: string; strong?: boolean; logo?: string }) {
  return (
    <View style={r.line}>
      <Text style={r.lineLabel}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 }}>
        {logo ? <PaymentLogo id={logo} size={18} /> : null}
        <Text style={[r.lineValue, strong && { fontFamily: fonts.heading }]}>{value}</Text>
      </View>
    </View>
  );
}

const r = StyleSheet.create({
  tabs: { flexDirection: "row", backgroundColor: colors.white, borderRadius: radius.pill, padding: 4, borderWidth: 1, borderColor: colors.line, marginBottom: 14 },
  tab: { flex: 1, minHeight: 40, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  tabOn: { backgroundColor: colors.brand },
  tabText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, overflow: "hidden", borderWidth: 1, borderColor: colors.line },
  head: { backgroundColor: colors.navy, padding: 20 },
  headTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { color: colors.white, fontFamily: fonts.semibold, fontSize: 12 },
  headLabel: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
  amount: { color: colors.white, fontFamily: fonts.display, fontSize: 32, marginTop: 2 },
  headMeta: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 },
  body: { padding: 20 },
  section: { fontFamily: fonts.heading, fontSize: 11, letterSpacing: 0.8, color: colors.muted, marginBottom: 2 },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  sep: { height: 1, backgroundColor: colors.line, marginVertical: 8, borderStyle: "dashed" },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 6 },
  lineLabel: { fontSize: 14, color: colors.muted },
  lineValue: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, textAlign: "right", flexShrink: 1 },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.line },
});
