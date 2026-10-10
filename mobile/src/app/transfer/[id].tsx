import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { WstWordmark } from "@/components/brand";
import { Flag } from "@/components/flag";
import { Icon } from "@/components/icons";
import { Badge, Button, Card, Divider, Header, IconButton, Notice, Screen, Small, SummaryRow } from "@/components/ui";
import { api, type Transfer } from "@/lib/api";
import { findCorridor, useCorridors } from "@/lib/corridors";
import { countryName, dateTime, deliveryEstimate, etaLabel, eventTitle, feeLabel, money, networkLabel, phone, rate, statusInfo, TERMINAL_STATUSES } from "@/lib/format";
import { colors, fonts } from "@/lib/theme";
import { useResend } from "@/lib/use-resend";
import { PaymentLogo } from "@/components/payment-logo";

const POLL_MS = 5000;

/** Étapes du suivi et événements serveur qui les marquent (l'heure affichée est celle du premier). */
const STEPS: { label: string; events: string[] }[] = [
  { label: "Transfert créé", events: ["created"] },
  { label: "Paiement reçu", events: ["payment_detected"] },
  { label: "Versement envoyé", events: ["payout_sent", "payout_accepted", "bank_manual"] },
  { label: "Livré", events: ["delivered"] },
];

/** Libellés d'événements absents de format.ts (affichés « Mise à jour » sinon). */
const EXTRA_EVENTS: Record<string, string> = {
  interac_declared: "Virement Interac signalé envoyé",
  payment_mismatch: "Montant reçu à vérifier",
  momo_callback: "Confirmation de l'opérateur",
};

/** Ce qui se passe ensuite, ou que faire, selon le statut. */
function nextStep(t: Transfer, eta: string): { tone: "brand" | "success" | "warn" | "danger" | "neutral"; icon: "clock" | "check" | "alert" | "info" | "send"; title: string; text: string } | null {
  const first = t.beneficiary.fullName.split(" ")[0];
  const bank = t.beneficiary.network === "BANK";
  switch (t.status) {
    case "payment_detected":
    case "payout_queued":
      return { tone: "brand", icon: "clock", title: "Et ensuite ?", text: `Votre paiement est reçu. Nous préparons le versement vers ${networkLabel(t.beneficiary.network)} de ${first}. Délai habituel : ${eta.toLowerCase()}.` };
    case "payout_sent":
      return {
        tone: "brand",
        icon: "send",
        title: "Et ensuite ?",
        text: bank
          ? `Le virement est parti vers la banque de ${first}. Comptez 1 à 2 jours ouvrables ; nous vous prévenons à l'arrivée.`
          : `L'argent est en route vers ${first}. Délai habituel : ${eta.toLowerCase()}. Nous vous prévenons dès qu'il est arrivé.`,
      };
    case "delivered":
      return { tone: "success", icon: "check", title: "Argent reçu", text: `${first} a bien reçu ${money(t.receiveAmountXaf, t.receiveCurrency)}. Vous pouvez lui envoyer l'avis de réception.` };
    case "payment_mismatch":
      return {
        tone: "danger",
        icon: "alert",
        title: "Que se passe-t-il ?",
        text: "Le montant reçu ne correspond pas à celui attendu. Ne refaites pas de paiement : notre équipe vérifie et vous contacte. Vous pouvez aussi nous écrire avec la référence ci-dessous.",
      };
    case "payout_failed":
      return {
        tone: "danger",
        icon: "alert",
        title: "Que se passe-t-il ?",
        text: `Le versement à ${first} n'a pas abouti (numéro, compte ou opérateur indisponible). Votre argent n'est pas perdu : notre équipe vous contacte pour le relancer. Vérifiez les coordonnées de ${first} en attendant.`,
      };
    case "expired":
      return { tone: "neutral", icon: "info", title: "Transfert expiré", text: "Aucun paiement n'a été reçu à temps, rien n'a été envoyé. Vous pouvez refaire ce transfert au taux du moment." };
    case "cancelled":
      return { tone: "neutral", icon: "info", title: "Transfert annulé", text: "Ce transfert a été annulé et ne sera pas versé. Si vous aviez déjà payé, contactez-nous avec la référence ci-dessous." };
    default:
      return null;
  }
}

export default function TransferScreen() {
  const { id, created } = useLocalSearchParams<{ id: string; created?: string }>();
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const corridors = useCorridors();
  const { resend, canResend } = useResend();
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
  const terminal = TERMINAL_STATUSES.includes(transfer.status);
  const first = transfer.beneficiary.fullName.split(" ")[0];
  const eta = etaLabel(deliveryEstimate(findCorridor(corridors, transfer.corridorId).deliveryEstimate, transfer.beneficiary.network));
  const events = transfer.events ?? [];
  const stepAt = (i: number) => events.find((e) => STEPS[i].events.includes(e.type))?.createdAt ?? (i === 0 ? transfer.createdAt : null);
  // Dernière étape franchie d'après les événements (un transfert annulé après paiement garde « Paiement reçu »).
  const reached = STEPS.reduce((acc, _s, i) => (stepAt(i) ? i : acc), 0);
  // Étape où le transfert s'est arrêté (incident, expiration, annulation) ; -1 s'il suit son cours.
  const stopped = failed ? info.step : terminal && transfer.status !== "delivered" ? Math.min(reached + 1, STEPS.length - 1) : -1;
  const doneUpTo = stopped >= 0 ? stopped - 1 : info.step;
  const pending = terminal ? -1 : info.step + 1;
  const pendingHint = (i: number) =>
    i === 1
      ? transfer.interac
        ? "En attente de votre virement Interac"
        : "En attente de votre paiement"
      : i === 2
        ? "Préparation du versement…"
        : transfer.beneficiary.network === "BANK"
          ? "Sous 1 à 2 jours ouvrables"
          : `Délai habituel : ${eta.toLowerCase()}`;
  const next = nextStep(transfer, eta);
  const help = () => router.push({ pathname: "/help/contact", params: { subject: `Transfert ${transfer.reference}` } });

  return (
    <Screen>
      <Header title="Suivi du transfert" right={<IconButton name="close" label="Fermer" onPress={close} />} back={false} />

      {created ? (
        <View style={{ marginBottom: 14 }}>
          <Notice tone="success" icon="check" title="Transfert créé" text={awaiting ? "Il ne reste plus qu'à régler le paiement." : "Merci ! Nous vous tenons informé à chaque étape."} />
        </View>
      ) : null}

      <Card style={{ alignItems: "center", marginBottom: 14 }}>
        <View style={{ marginBottom: 12 }}>
          <WstWordmark size={20} />
        </View>
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
        {STEPS.map(({ label }, i) => {
          const done = i <= doneUpTo;
          const stop = i === stopped;
          const at = done ? stepAt(i) : null;
          const stopColor = failed ? colors.danger : colors.muted;
          return (
            <View
              key={label}
              style={st.step}
              accessible
              accessibilityLabel={`${label} : ${done ? `terminé${at ? `, ${dateTime(at)}` : ""}` : stop ? info.label : i === pending ? pendingHint(i) : "à venir"}`}
            >
              <View style={{ alignItems: "center" }}>
                <View
                  style={[
                    st.bullet,
                    done && { backgroundColor: colors.brand, borderColor: colors.brand },
                    i === pending && { borderColor: colors.brand },
                    stop && { backgroundColor: stopColor, borderColor: stopColor },
                  ]}
                >
                  {done ? <Icon name="check" color={colors.white} size={12} strokeWidth={3} /> : stop ? <Icon name="close" color={colors.white} size={12} strokeWidth={3} /> : null}
                </View>
                {i < STEPS.length - 1 ? <View style={[st.line, i < doneUpTo && { backgroundColor: colors.brand }]} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: i < STEPS.length - 1 ? 18 : 0 }}>
                <Text style={[st.stepLabel, !done && !stop && { color: colors.muted }, stop && failed && { color: colors.danger }]}>{stop ? info.label : label}</Text>
                {at ? <Small>{dateTime(at)}</Small> : i === pending ? <Small style={{ color: colors.brand }}>{pendingHint(i)}</Small> : null}
              </View>
            </View>
          );
        })}
      </Card>

      {next ? (
        <View style={{ marginBottom: 14 }}>
          <Notice tone={next.tone} icon={next.icon} title={next.title} text={next.text} />
        </View>
      ) : null}

      {terminal ? (
        <View style={{ gap: 10, marginBottom: 14 }}>
          {failed ? <Button title="Contacter le support" icon="mail" onPress={help} /> : null}
          {canResend ? (
            <Button
              title={`Renvoyer ${money(transfer.sendAmountCad, transfer.sendCurrency)} à ${first}`}
              icon="refresh"
              variant={failed ? "secondary" : "primary"}
              onPress={() => resend(transfer)}
            />
          ) : null}
          {transfer.status === "delivered" ? (
            <Button
              title={`Prévenir ${first}`}
              icon="send"
              variant="secondary"
              onPress={() => router.push({ pathname: "/receipt/[id]", params: { id: transfer.id, mode: "recipient" } })}
            />
          ) : null}
        </View>
      ) : null}

      {awaiting ? (
        <View style={{ gap: 10, marginBottom: 14 }}>
          {transfer.interac ? (
            <>
              <Notice
                tone="warn"
                icon="clock"
                text={`En attente de votre virement Interac de ${money(transfer.interac.amount, transfer.interac.currency)}, à envoyer avant le ${dateTime(transfer.interac.expiresAt)}. Le versement part dès sa réception ; cet écran se met à jour automatiquement.`}
              />
              <Button
                title="Voir les instructions du virement"
                icon="bank"
                onPress={() => router.push({ pathname: "/send/interac", params: { id: transfer.id } })}
              />
            </>
          ) : mock ? (
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
        <SummaryRow label="Frais" value={feeLabel(transfer.feeCad, transfer.sendCurrency)} />
        <SummaryRow label="Total payé" value={money(transfer.totalCad, transfer.sendCurrency)} strong />
        <SummaryRow label="Taux" value={`1 ${transfer.sendCurrency} = ${rate(transfer.rate)} ${transfer.receiveCurrency}`} />
        <SummaryRow label="Reçu" value={money(transfer.receiveAmountXaf, transfer.receiveCurrency)} highlight />
        <Divider />
        <SummaryRow label="Bénéficiaire" value={transfer.beneficiary.fullName} />
        <SummaryRow label="Pays" value={countryName(transfer.destCountry)} />
        <SummaryRow label="Réception" value={networkLabel(transfer.beneficiary.network)} valueIcon={<PaymentLogo id={transfer.beneficiary.network} size={20} />} />
        {transfer.beneficiary.accountMasked ? <SummaryRow label="Compte" value={transfer.beneficiary.accountMasked} /> : null}
        {transfer.beneficiary.phone ? <SummaryRow label="Téléphone" value={phone(transfer.beneficiary.phone)} /> : null}
        <SummaryRow label="Créé le" value={dateTime(transfer.createdAt)} />
      </Card>

      {transfer.events?.length ? (
        <Card style={{ marginBottom: 14, paddingVertical: 4 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showEvents }}
            onPress={() => setShowEvents((v) => !v)}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}
          >
            <Text style={{ fontFamily: fonts.semibold, color: colors.ink, fontSize: 14 }}>Historique détaillé ({transfer.events.length})</Text>
            <View style={{ transform: [{ rotate: showEvents ? "-90deg" : "90deg" }] }}>
              <Icon name="chev" size={18} color={colors.muted} />
            </View>
          </Pressable>
          {(showEvents ? [...transfer.events].reverse() : []).map((e) => (
            <View key={e.id} style={{ paddingVertical: 6 }}>
              <Text style={{ fontFamily: fonts.semibold, color: colors.ink, fontSize: 14 }}>{EXTRA_EVENTS[e.type] ?? eventTitle(e.type)}</Text>
              <Small>{dateTime(e.createdAt)}</Small>
            </View>
          ))}
        </Card>
      ) : null}

      {!awaiting ? <Button title="Voir le reçu" icon="history" variant="secondary" onPress={() => router.push({ pathname: "/receipt/[id]", params: { id: transfer.id } })} /> : null}
      {!failed ? <Button title="Aide sur ce transfert" variant="ghost" icon="help" onPress={help} style={{ marginTop: 6 }} /> : null}
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
