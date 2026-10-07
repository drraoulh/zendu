import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/icons";
import { PaymentLogo } from "@/components/payment-logo";
import { Button, Card, Header, Notice, Screen, Small } from "@/components/ui";
import { api, type Transfer } from "@/lib/api";
import { dateTime, money } from "@/lib/format";
import { colors, fonts, radius } from "@/lib/theme";

const POLL_MS = 6000;

/**
 * Paiement par virement Interac : le client envoie le montant exact à l'adresse de dépôt PWFINTECH
 * depuis son appli bancaire, avec la référence du transfert en message. L'écran suit le transfert et
 * passe à la confirmation dès que l'équipe a validé la réception.
 */
export default function InteracPayment() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState<"declare" | "simulate" | null>(null);
  const done = useRef(false);

  const finish = useCallback(
    (t: Transfer) => {
      if (done.current || t.status === "awaiting_payment") return;
      done.current = true;
      if (["payment_mismatch", "expired", "cancelled"].includes(t.status)) {
        router.replace({ pathname: "/transfer/[id]", params: { id } });
      } else {
        router.replace({ pathname: "/send/success", params: { id, card: "Virement Interac" } });
      }
    },
    [id],
  );

  const load = useCallback(async () => {
    try {
      const t = await api.transfer(id);
      setTransfer(t);
      setError(null);
      if (t.status !== "awaiting_payment") finish(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible");
    }
  }, [id, finish]);

  useEffect(() => {
    const first = setTimeout(() => void load(), 0);
    const timer = setInterval(() => void load(), POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  async function copy(key: string, value: string) {
    await Clipboard.setStringAsync(value);
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
  }

  async function declare() {
    setBusy("declare");
    setError(null);
    try {
      await api.interacDeclare(id);
      router.replace({ pathname: "/transfer/[id]", params: { id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setBusy(null);
    }
  }

  async function simulate() {
    setBusy("simulate");
    setError(null);
    try {
      finish(await api.simulatePay(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation impossible");
    } finally {
      setBusy(null);
    }
  }

  const leave = () => router.dismissTo("/(tabs)");
  const info = transfer?.interac;

  if (!transfer || !info) {
    return (
      <Screen>
        <Header title="Virement Interac" onBack={leave} />
        <View style={{ alignItems: "center", paddingTop: 60, gap: 16 }}>
          {error ? <Notice tone="danger" icon="alert" text={error} /> : <ActivityIndicator color={colors.brand} />}
          {error ? <Button title="Réessayer" size="sm" onPress={load} /> : null}
        </View>
      </Screen>
    );
  }

  const amount = money(info.amount, info.currency);

  return (
    <Screen
      footer={
        <View style={{ gap: 8 }}>
          <Button title="J'ai envoyé le virement" icon="check" onPress={declare} loading={busy === "declare"} disabled={busy !== null} />
          {info.simulate ? (
            <Button title="Simuler la réception (démo)" variant="ghost" size="sm" onPress={simulate} loading={busy === "simulate"} disabled={busy !== null} />
          ) : null}
        </View>
      }
    >
      <Header title="Virement Interac" subtitle={`Réf. ${transfer.reference}`} onBack={leave} />

      <Card style={s.hero}>
        <PaymentLogo id="INTERAC" size={30} />
        <Text style={s.heroLabel}>MONTANT EXACT À ENVOYER</Text>
        <Text style={s.heroAmount} numberOfLines={1} adjustsFontSizeToFit>
          {amount}
        </Text>
        <Small style={{ color: "rgba(255,255,255,0.75)", textAlign: "center" }}>
          {transfer.beneficiary.fullName} reçoit {money(transfer.receiveAmountXaf, transfer.receiveCurrency)}
        </Small>
      </Card>

      <Text style={s.section}>Dans l&apos;appli de votre banque</Text>
      <Card style={{ paddingVertical: 4, marginBottom: 14 }}>
        <Step n={1} title="Ouvrez « Virement Interac » (Interac e-Transfer)" />
        <Step
          n={2}
          title="Destinataire"
          value={info.email ?? "Adresse de dépôt PWFINTECH à compléter"}
          muted={!info.email}
          copied={copied === "email"}
          onCopy={info.email ? () => copy("email", info.email!) : undefined}
        />
        <Step n={3} title="Montant exact" value={amount} copied={copied === "amount"} onCopy={() => copy("amount", info.amount.toFixed(2))} />
        <Step
          n={4}
          title="Message (obligatoire)"
          value={info.message}
          hint="C'est ce qui relie votre virement à ce transfert."
          copied={copied === "message"}
          onCopy={() => copy("message", info.message)}
          last
        />
      </Card>

      <Notice
        tone="neutral"
        icon="clock"
        text={`À envoyer avant le ${dateTime(info.expiresAt)}. Dès que votre virement est reçu, l'argent part vers ${transfer.beneficiary.fullName.split(" ")[0]} et vous êtes notifié.`}
      />
      {info.simulate ? (
        <View style={{ marginTop: 10 }}>
          <Notice tone="warn" icon="info" text="Mode démonstration : aucun virement réel n'est attendu. Utilisez « Simuler la réception »." />
        </View>
      ) : null}
      {error ? (
        <View style={{ marginTop: 10 }}>
          <Notice tone="danger" icon="alert" text={error} />
        </View>
      ) : null}
    </Screen>
  );
}

function Step({
  n,
  title,
  value,
  hint,
  muted,
  copied,
  onCopy,
  last,
}: {
  n: number;
  title: string;
  value?: string;
  hint?: string;
  muted?: boolean;
  copied?: boolean;
  onCopy?: () => void;
  last?: boolean;
}) {
  return (
    <View style={[s.step, !last && s.stepBorder]}>
      <View style={s.num}>
        <Text style={s.numText}>{n}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.stepTitle}>{title}</Text>
        {value ? (
          <Text style={[s.value, muted && { color: colors.muted, fontFamily: fonts.semibold }]} selectable>
            {value}
          </Text>
        ) : null}
        {hint ? <Small>{hint}</Small> : null}
      </View>
      {onCopy ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Copier ${title.toLowerCase()}`}
          onPress={onCopy}
          hitSlop={8}
          style={({ pressed }) => [s.copy, copied && s.copied, pressed && { opacity: 0.8 }]}
        >
          <Icon name={copied ? "check" : "copy"} color={copied ? colors.success : colors.brand} size={16} />
          <Text style={[s.copyText, copied && { color: colors.success }]}>{copied ? "Copié" : "Copier"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  hero: { alignItems: "center", gap: 6, marginBottom: 18, backgroundColor: colors.navy, borderColor: colors.navy, paddingVertical: 20 },
  heroLabel: { color: colors.silver, fontFamily: fonts.heading, fontSize: 12, letterSpacing: 0.8, marginTop: 6 },
  heroAmount: { color: colors.white, fontFamily: fonts.display, fontSize: 34 },
  section: { fontFamily: fonts.heading, fontSize: 16, color: colors.ink, marginBottom: 10 },
  step: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  stepBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  num: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  numText: { fontFamily: fonts.heading, color: colors.brand, fontSize: 13 },
  stepTitle: { fontFamily: fonts.semibold, color: colors.muted, fontSize: 13 },
  value: { fontFamily: fonts.heading, color: colors.ink, fontSize: 16, marginTop: 2 },
  copy: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.brandSoft },
  copied: { backgroundColor: colors.successSoft },
  copyText: { fontFamily: fonts.semibold, color: colors.brand, fontSize: 13 },
});
