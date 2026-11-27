import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { PoweredBy, WstWordmark } from "@/components/brand";
import { RecipientNotice } from "@/components/recipient-notice";
import { Button, Header, Notice, Screen, Small } from "@/components/ui";
import { api, type Transfer } from "@/lib/api";
import { countryName, dateTime, feeLabel, money, networkLabel, phone, rateLine, statusInfo } from "@/lib/format";
import { shareReceiptPdf } from "@/lib/receipt-pdf";
import { colors, fonts, radius } from "@/lib/theme";
import { cardLogoId, PaymentLogo } from "@/components/payment-logo";
import { tr } from "@/lib/i18n";

type Mode = "mine" | "recipient";

export default function Receipt() {
  const params = useLocalSearchParams<{ id: string; card?: string; mode?: Mode }>();
  const [t, setT] = useState<Transfer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(params.mode === "recipient" ? "recipient" : "mine");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

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
        <Header title={tr("Reçu")} />
        {error ? (
          <View style={{ gap: 12 }}>
            <Notice tone="danger" icon="alert" text={error} />
            <Button title={tr("Réessayer")} icon="refresh" size="sm" variant="secondary" onPress={load} />
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
  const paidWith = params.card || ({ interac_manual: tr("Virement Interac"), interac: tr("Virement Interac"), manual_payin: tr("Paiement manuel"), stripe: tr("Carte de débit") } as Record<string, string>)[t.payInProvider];
  // Espaces insécables : le numéro ne se coupe pas en fin de ligne (« +237 670 000 / 000 »).
  const benLine = [networkLabel(ben.network), ben.accountMasked ?? (ben.phone ? phone(ben.phone).replace(/ /g, "\u00a0") : null)].filter(Boolean).join(" · ");

  async function sharePdf(variant: "receipt" | "recipient") {
    if (!t || pdfBusy) return;
    setPdfBusy(true);
    setPdfError(null);
    try {
      await shareReceiptPdf(t.id, t.reference, variant);
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : tr("Reçu indisponible pour le moment."));
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <Screen
      footer={
        mode === "recipient" ? (
          <View style={{ gap: 6 }}>
            {pdfError ? <Notice tone="danger" icon="alert" text={pdfError} /> : null}
            <Button title={tr("Envoyer à {0}", first)} icon="download" loading={pdfBusy} onPress={() => sharePdf("recipient")} />
            <Small style={{ textAlign: "center" }}>{tr("Avis PDF · par WhatsApp, SMS ou courriel · sans frais ni données de paiement")}</Small>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {pdfError ? <Notice tone="danger" icon="alert" text={pdfError} /> : null}
            <Button title={tr("Partager le reçu PDF")} icon="download" loading={pdfBusy} onPress={() => sharePdf("receipt")} />
          </View>
        )
      }
    >
      <Header title={tr("Reçu")} />
      <View style={r.tabs} accessibilityRole="tablist">
        {(
          [
            ["mine", tr("Mon reçu")],
            ["recipient", tr("Pour {0}", first)],
          ] as const
        ).map(([m, label]) => (
          <Pressable
            key={m}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === m }}
            onPress={() => setMode(m)}
            style={[r.tab, mode === m && r.tabOn]}
          >
            <Text style={[r.tabText, mode === m && { color: colors.white }]} numberOfLines={1}>{tr(label)}</Text>
          </Pressable>
        ))}
      </View>

      {mode === "recipient" ? (
        <>
          <Small style={{ marginBottom: 12 }}>
            {tr("Envoyez cet avis à {0} pour l'informer de votre envoi. Il ne contient ni vos frais ni votre moyen de paiement.", first)}
          </Small>
          <View>
            <RecipientNotice transfer={t} />
          </View>
        </>
      ) : (
        <View style={r.card}>
          <View style={r.head}>
            <View style={r.headTop}>
              <WstWordmark size={22} negative />
              <View style={[r.badge, { backgroundColor: info.tone === "success" ? colors.success : info.tone === "danger" ? colors.danger : "rgba(255,255,255,0.16)" }]}>
                <Text style={r.badgeText}>{tr(info.label)}</Text>
              </View>
            </View>
            <Text style={r.headLabel}>{tr("{0} reçoit", ben.fullName)}</Text>
            <Text style={r.amount}>{money(t.receiveAmountXaf, t.receiveCurrency)}</Text>
            <Text style={r.headMeta}>{dateTime(t.createdAt)}</Text>
          </View>
          <View style={r.body}>
            <Party label={tr("Expéditeur")} name={t.senderName} line={`${t.senderEmail} · ${countryName(t.sourceCountry)}`} />
            <Party label={tr("Destinataire")} name={ben.fullName} line={`${benLine} · ${countryName(t.destCountry)}`} logo={ben.network} />
            <View style={r.sep} />
            <Line label={tr("Montant envoyé")} value={money(t.sendAmountCad, t.sendCurrency)} />
            <Line label={tr("Frais")} value={feeLabel(t.feeCad, t.sendCurrency)} />
            <Line label={tr("Taux de change")} value={rateLine(t.rate, t.sendCurrency, t.receiveCurrency)} />
            <Line label={tr("Total payé")} value={money(t.totalCad, t.sendCurrency)} strong />
            <View style={r.sep} />
            <Line label={tr("Référence")} value={t.reference} strong />
            {paidWith ? (
              <Line label={tr("Payé avec")} value={paidWith} logo={paidWith.startsWith("Virement Interac") ? "INTERAC" : cardLogoId((params.card ?? "").split(" ")[0])} />
            ) : null}
            {deliveredAt ? <Line label={tr("Livré le")} value={dateTime(deliveredAt)} /> : null}
          </View>
          <View style={r.foot}>
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
        <Text style={r.section}>{label}</Text>
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
      <Text style={r.lineLabel}>{tr(label)}</Text>
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
  headLabel: { fontFamily: fonts.regular, color: "rgba(255,255,255,0.75)", fontSize: 13 },
  amount: { color: colors.white, fontFamily: fonts.display, fontSize: 32, marginTop: 2 },
  headMeta: { fontFamily: fonts.regular, color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 },
  body: { padding: 20 },
  section: { fontFamily: fonts.heading, fontSize: 11, letterSpacing: 0, color: colors.muted, marginBottom: 2 },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  sep: { height: 1, backgroundColor: colors.line, marginVertical: 8, borderStyle: "dashed" },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 6 },
  lineLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  lineValue: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, textAlign: "right", flexShrink: 1 },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.line },
});
