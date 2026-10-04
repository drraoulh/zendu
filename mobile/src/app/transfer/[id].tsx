import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Flag } from "@/components/flag";
import { Icon } from "@/components/icons";
import { Badge, Button, Card, Divider, Header, IconButton, Notice, Screen, Small, SummaryRow } from "@/components/ui";
import { api, type Transfer } from "@/lib/api";
import { countryName, dateTime, eventTitle, money, networkLabel, phone, rate, statusInfo, TERMINAL_STATUSES } from "@/lib/format";
import { colors, fonts } from "@/lib/theme";

const POLL_MS = 5000;
const STEPS = ["Transfert créé", "Paiement reçu", "Versement envoyé", "Livré"];

export default function TransferScreen() {
  const { id, created } = useLocalSearchParams<{ id: string; created?: string }>();
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const statusRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const t = await api.transfer(id);
      statusRef.current = t.status;
      setTransfer(t);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible");
    }
  }, [id]);

  useEffect(() => {
    const first = setTimeout(() => void load(), 0);
    const timer = setInterval(() => {
      if (statusRef.current && TERMINAL_STATUSES.includes(statusRef.current)) return;
      void load();
    }, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  async function simulatePay() {
    setBusy(true);
    setActionError(null);
    try {
      await api.simulatePay(id);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Paiement impossible");
    } finally {
      setBusy(false);
    }
  }

  async function copyRef() {
    if (!transfer) return;
    await Clipboard.setStringAsync(transfer.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const close = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/history"));

  if (!transfer) {
    return (
      <Screen>
        <Header title="Suivi" />
        <View style={{ alignItems: "center", paddingTop: 60, gap: 16 }}>
          {error ? (
            <>
              <Notice tone="danger" icon="alert" text={error} />
              <Button title="Réessayer" size="sm" onPress={load} />
            </>
          ) : (
            <ActivityIndicator color={colors.brand} size="large" />
          )}
        </View>
      </Screen>
    );
  }

  const info = statusInfo(transfer.status);
  const failed = info.tone === "danger";
  const awaiting = transfer.status === "awaiting_payment";
  const mock = transfer.payInProvider === "mock";

  return (
    <Screen>
      <Header title="Suivi du transfert" right={<IconButton name="close" label="Fermer" onPress={close} />} back={false} />

      {created ? (
        <View style={{ marginBottom: 14 }}>
          <Notice tone="success" icon="check" title="Transfert créé" text={awaiting ? "Il ne reste plus qu'à régler le paiement." : "Merci ! Nous vous tenons informé à chaque étape."} />
        </View>
      ) : null}

      <Card style={{ alignItems: "center", marginBottom: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Flag code={transfer.sourceCountry} size={22} />
          <Icon name="chev" size={16} color={colors.muted} />
          <Flag code={transfer.destCountry} size={22} />
        </View>
        <Text style={st.amount}>{money(transfer.receiveAmountXaf, transfer.receiveCurrency)}</Text>
        <Small>pour {transfer.beneficiary.fullName}</Small>
        <View style={{ marginTop: 10 }}>
          <Badge label={info.label} tone={info.tone} />
        </View>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        {STEPS.map((label, i) => {
          const done = !failed && info.step >= i;
          const current = info.step === i && !TERMINAL_STATUSES.includes(transfer.status);
          return (
            <View key={label} style={st.step}>
              <View style={{ alignItems: "center" }}>
                <View style={[st.bullet, done && { backgroundColor: colors.brand, borderColor: colors.brand }, failed && info.step === i && { backgroundColor: colors.danger, borderColor: colors.danger }]}>
                  {done ? <Icon name="check" color={colors.white} size={12} strokeWidth={3} /> : null}
                </View>
                {i < STEPS.length - 1 ? <View style={[st.line, done && info.step > i && { backgroundColor: colors.brand }]} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: i < STEPS.length - 1 ? 18 : 0 }}>
                <Text style={[st.stepLabel, !done && { color: colors.muted }]}>{label}</Text>
                {current ? <Small>En cours…</Small> : null}
              </View>
            </View>
          );
        })}
      </Card>

      {awaiting ? (
        <View style={{ gap: 10, marginBottom: 14 }}>
          {mock ? (
            <>
              <Notice tone="warn" icon="info" text="Mode démonstration : aucun paiement réel n'est prélevé." />
              <Button title={`Simuler le paiement de ${money(transfer.totalCad, transfer.sendCurrency)}`} icon="wallet" onPress={simulatePay} loading={busy} />
            </>
          ) : (
            <Notice tone="warn" icon="clock" text="Paiement en attente de confirmation. Cet écran se met à jour automatiquement." />
          )}
          {actionError ? <Notice tone="danger" icon="alert" text={actionError} /> : null}
        </View>
      ) : null}

      <Card style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Small>Référence</Small>
            <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.ink }}>{transfer.reference}</Text>
          </View>
          <Button title={copied ? "Copiée" : "Copier"} icon={copied ? "check" : "copy"} size="sm" variant="secondary" onPress={copyRef} />
        </View>
        <Divider />
        <SummaryRow label="Envoyé" value={money(transfer.sendAmountCad, transfer.sendCurrency)} />
        <SummaryRow label="Frais" value={money(transfer.feeCad, transfer.sendCurrency)} />
        <SummaryRow label="Total payé" value={money(transfer.totalCad, transfer.sendCurrency)} strong />
        <SummaryRow label="Taux" value={`1 ${transfer.sendCurrency} = ${rate(transfer.rate)} ${transfer.receiveCurrency}`} />
        <SummaryRow label="Reçu" value={money(transfer.receiveAmountXaf, transfer.receiveCurrency)} highlight />
        <Divider />
        <SummaryRow label="Bénéficiaire" value={transfer.beneficiary.fullName} />
        <SummaryRow label="Pays" value={countryName(transfer.destCountry)} />
        <SummaryRow label="Réception" value={networkLabel(transfer.beneficiary.network)} />
        {transfer.beneficiary.accountMasked ? <SummaryRow label="Compte" value={transfer.beneficiary.accountMasked} /> : null}
        {transfer.beneficiary.phone ? <SummaryRow label="Téléphone" value={phone(transfer.beneficiary.phone)} /> : null}
        <SummaryRow label="Créé le" value={dateTime(transfer.createdAt)} />
      </Card>

      {transfer.events?.length ? (
        <Card style={{ marginBottom: 14 }}>
          <Small style={{ marginBottom: 6 }}>Historique</Small>
          {[...transfer.events].reverse().map((e) => (
            <View key={e.id} style={{ paddingVertical: 6 }}>
              <Text style={{ fontFamily: fonts.semibold, color: colors.ink, fontSize: 14 }}>{eventTitle(e.type)}</Text>
              <Small>{dateTime(e.createdAt)}</Small>
            </View>
          ))}
        </Card>
      ) : null}

      {!awaiting ? <Button title="Voir le reçu" icon="history" variant="secondary" onPress={() => router.push({ pathname: "/receipt/[id]", params: { id: transfer.id } })} /> : null}
      <Button
        title="Aide sur ce transfert"
        variant="ghost"
        icon="help"
        onPress={() => router.push({ pathname: "/help/contact", params: { subject: `Transfert ${transfer.reference}` } })}
        style={{ marginTop: 6 }}
      />
    </Screen>
  );
}

const st = StyleSheet.create({
  amount: { fontFamily: fonts.display, fontSize: 30, color: colors.navy, marginTop: 12 },
  step: { flexDirection: "row", gap: 12 },
  bullet: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  line: { width: 2, flex: 1, backgroundColor: colors.line, marginVertical: 2 },
  stepLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
});
