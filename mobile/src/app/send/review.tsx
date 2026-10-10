import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Button, Card, Choice, Divider, H1, Header, Notice, Screen, Small, Steps, SummaryRow } from "@/components/ui";
import { api, type Quote } from "@/lib/api";
import { countryName, deliveryEstimate, etaLabel, feeLabel, money, networkLabel, phone, rate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";
import { PaymentLogo } from "@/components/payment-logo";

export default function Review() {
  const { draft, setDraft } = useStore();
  const [quote, setQuote] = useState<Quote | null>(draft.quote);
  const [error, setError] = useState<string | null>(null);
  const recipient = draft.recipient;
  // Interac n'existe que pour les envois payés en dollars canadiens.
  const interacOk = quote ? quote.sendCurrency === "CAD" : draft.corridorId.startsWith("CA-");
  const method = interacOk ? draft.payMethod : "card";

  function next() {
    if (method === "interac") {
      setDraft({ payMethod: "interac", cardId: null });
      router.push("/send/processing");
    } else {
      setDraft({ payMethod: "card" });
      router.push("/send/pay");
    }
  }

  // Devis rafraîchi à l'ouverture : c'est ce montant que le serveur appliquera.
  useEffect(() => {
    if (!draft.sendAmount) return;
    api
      .quote(draft.corridorId, draft.sendAmount, "send", recipient?.network)
      .then((q) => {
        setQuote(q);
        // Le paiement et le reçu reprennent ce devis à jour.
        setDraft({ quote: q });
      })
      .catch((e: Error) => setError(e.message));
  }, [draft.corridorId, draft.sendAmount, recipient?.network, setDraft]);

  if (!recipient) return <Redirect href="/(tabs)" />;

  return (
    <Screen
      footer={
        <View style={{ gap: 6 }}>
          <Button
            title={quote ? `${method === "interac" ? "Payer par Interac" : "Payer"} ${money(quote.total, quote.sendCurrency)}` : "Payer"}
            icon="lock"
            onPress={next}
            disabled={!quote}
          />
          <Small style={{ textAlign: "center" }}>Paiement sécurisé · reçu envoyé par courriel</Small>
        </View>
      }
    >
      <Header title="Vérification" />
      <Steps current={3} total={3} label="Paiement" />

      <Card style={{ alignItems: "center", marginBottom: 14, backgroundColor: colors.navy, borderColor: colors.navy }}>
        <Text style={{ color: colors.silver, fontFamily: fonts.heading, fontSize: 12, letterSpacing: 0.8 }}>{recipient.fullName.toUpperCase()} REÇOIT</Text>
        <Text style={{ color: colors.white, fontFamily: fonts.display, fontSize: 30, marginTop: 6 }}>
          {quote ? money(quote.receiveAmount, quote.receiveCurrency) : "…"}
        </Text>
        <View style={{ marginTop: 10 }}>
          <PaymentLogo id={recipient.network} size={26} />
        </View>
        <Small style={{ color: "rgba(255,255,255,0.75)", marginTop: 6, textAlign: "center" }}>
          {networkLabel(recipient.network)}
          {recipient.phone ? ` · ${phone(recipient.phone)}` : recipient.bankName ? ` · ${recipient.bankName}` : ""} · {countryName(recipient.country)}
        </Small>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        {quote ? (
          <>
            <SummaryRow label="Vous envoyez" value={money(quote.sendAmount, quote.sendCurrency)} />
            <SummaryRow label="Taux de change" value={`1 ${quote.sendCurrency} = ${rate(quote.rate)} ${quote.receiveCurrency}`} />
            <SummaryRow label="Frais" value={feeLabel(quote.fee, quote.sendCurrency)} />
            <Divider />
            <SummaryRow label="Total à payer" value={money(quote.total, quote.sendCurrency)} strong />
            <SummaryRow label="Délai estimé" value={etaLabel(deliveryEstimate(quote.deliveryEstimate, recipient.network))} />
            {quote.fee === 0 ? (
              <Small style={{ marginTop: 8 }}>Sans frais d&apos;envoi : notre rémunération est déjà comprise dans le taux de change affiché.</Small>
            ) : null}
          </>
        ) : (
          <Small>Calcul du devis…</Small>
        )}
      </Card>

      <H1 style={{ fontSize: 18, marginBottom: 10 }}>Payer avec</H1>
      {interacOk ? (
        <Choice
          leading={<PaymentLogo id="INTERAC" size={22} />}
          label="Virement Interac"
          description="Le moins cher · depuis votre appli bancaire"
          selected={method === "interac"}
          onPress={() => setDraft({ payMethod: "interac" })}
        />
      ) : null}
      <Choice
        leading={
          <View style={{ flexDirection: "row", gap: 4 }}>
            <PaymentLogo id="VISA" size={22} />
            <PaymentLogo id="MASTERCARD" size={22} />
          </View>
        }
        label="Carte de débit"
        description="Visa Débit, Mastercard Débit · cartes de crédit non acceptées"
        selected={method === "card"}
        onPress={() => setDraft({ payMethod: "card" })}
      />
      {error ? <Notice tone="danger" icon="alert" text={error} /> : null}
    </Screen>
  );
}
