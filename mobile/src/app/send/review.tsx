import { Redirect, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, Card, Divider, H1, Header, Notice, P, Screen, Small, Steps, SummaryRow } from "@/components/ui";
import { api, type Quote } from "@/lib/api";
import { countryName, etaLabel, money, networkLabel, rate } from "@/lib/format";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";

export default function Review() {
  const { profile } = useSession();
  const { draft, resetDraft, addTransfer } = useStore();
  const [quote, setQuote] = useState<Quote | null>(draft.quote);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const recipient = draft.recipient;

  // Devis rafraîchi à l'ouverture : c'est ce montant que le serveur appliquera.
  useEffect(() => {
    if (!draft.sendAmount) return;
    api
      .quote(draft.corridorId, draft.sendAmount)
      .then(setQuote)
      .catch((e: Error) => setError(e.message));
  }, [draft.corridorId, draft.sendAmount]);

  if (!recipient || !profile) return <Redirect href="/(tabs)/send" />;

  async function confirm() {
    if (!recipient || !profile) return;
    setBusy(true);
    setError(null);
    try {
      const { transfer, payIn } = await api.createTransfer({
        corridorId: draft.corridorId,
        sendAmount: draft.sendAmount,
        senderName: `${profile.firstName} ${profile.lastName}`,
        senderEmail: profile.email,
        beneficiary: {
          fullName: recipient.fullName,
          phone: recipient.phone ?? "",
          network: recipient.network,
          bankName: recipient.bankName,
          accountNumber: recipient.accountNumber,
          bankCode: recipient.bankCode,
        },
      });
      addTransfer({ id: transfer.id, reference: transfer.reference, createdAt: transfer.createdAt });
      resetDraft();
      router.dismissAll();
      router.replace({ pathname: "/transfer/[id]", params: { id: transfer.id, created: "1" } });
      if (payIn.provider === "stripe" && payIn.checkoutUrl) await WebBrowser.openBrowserAsync(payIn.checkoutUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen footer={<Button title={quote ? `Payer ${money(quote.total, quote.sendCurrency)}` : "Payer"} icon="lock" onPress={confirm} loading={busy} disabled={!quote} />}>
      <Header title="Récapitulatif" />
      <Steps current={3} total={3} />
      <H1>Vérifiez avant de payer</H1>
      <P style={{ marginTop: 6, marginBottom: 18 }}>Ces informations ne pourront plus être modifiées après le paiement.</P>

      <Card style={{ marginBottom: 14 }}>
        <Small style={{ marginBottom: 4 }}>Montant</Small>
        {quote ? (
          <>
            <SummaryRow label="Vous envoyez" value={money(quote.sendAmount, quote.sendCurrency)} />
            <SummaryRow label="Frais" value={money(quote.fee, quote.sendCurrency)} />
            <SummaryRow label="Taux" value={`1 ${quote.sendCurrency} = ${rate(quote.rate)} ${quote.receiveCurrency}`} />
            <Divider />
            <SummaryRow label="Total à payer" value={money(quote.total, quote.sendCurrency)} strong />
            <SummaryRow label="Le bénéficiaire reçoit" value={money(quote.receiveAmount, quote.receiveCurrency)} highlight />
            <SummaryRow label="Délai estimé" value={etaLabel(quote.deliveryEstimate)} />
          </>
        ) : (
          <Small>Calcul du devis…</Small>
        )}
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <Small style={{ marginBottom: 4 }}>Bénéficiaire</Small>
        <SummaryRow label="Nom" value={recipient.fullName} />
        <SummaryRow label="Pays" value={countryName(recipient.country)} />
        <SummaryRow label="Réception" value={networkLabel(recipient.network)} />
        {recipient.bankName ? <SummaryRow label="Banque" value={recipient.bankName} /> : null}
        {recipient.accountNumber ? <SummaryRow label="Compte" value={`•••• ${recipient.accountNumber.slice(-4)}`} /> : null}
        {recipient.phone ? <SummaryRow label="Téléphone" value={`+${recipient.phone}`} /> : null}
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <Small style={{ marginBottom: 4 }}>Expéditeur</Small>
        <SummaryRow label="Nom" value={`${profile.firstName} ${profile.lastName}`} />
        <SummaryRow label="E-mail" value={profile.email} />
      </Card>

      <View style={{ gap: 10 }}>
        {error ? <Notice tone="danger" icon="alert" text={error} /> : null}
        <Notice tone="neutral" icon="lock" text="Paiement sécurisé. Vous recevrez un reçu par e-mail." />
      </View>
    </Screen>
  );
}
