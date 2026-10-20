import { Redirect, router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Button, Card, Choice, Divider, H1, Header, Notice, Screen, Small, SEND_STEPS, Steps, SummaryRow } from "@/components/ui";
import { api, type Quote } from "@/lib/api";
import { countryName, deliveryEstimate, etaLabel, feeLabel, money, networkLabel, phone, rateLine } from "@/lib/format";
import { findCorridor, payMethodsOf, useCorridors } from "@/lib/corridors";
import { useStore } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";
import { PaymentLogo } from "@/components/payment-logo";
import { tr } from "@/lib/i18n";

export default function Review() {
  const { draft, setDraft } = useStore();
  const [quote, setQuote] = useState<Quote | null>(draft.quote);
  const [error, setError] = useState<string | null>(null);
  const recipient = draft.recipient;
  // Moyens ouverts par le serveur pour ce trajet (Interac : envois en dollars canadiens ; carte :
  // seulement en démonstration tant qu'aucun prestataire de carte n'est branché).
  const methods = payMethodsOf(findCorridor(useCorridors(), draft.corridorId));
  const interacOk = methods.includes("interac") && (quote ? quote.sendCurrency === "CAD" : draft.corridorId.startsWith("CA-"));
  const cardOk = methods.includes("card");
  const method = draft.payMethod === "card" && cardOk ? "card" : interacOk ? "interac" : cardOk ? "card" : null;

  // Double appui sur « Payer » : un seul écran de traitement (donc un seul transfert créé).
  const going = useRef(false);
  useFocusEffect(
    useCallback(() => {
      going.current = false;
    }, []),
  );

  function next() {
    if (!method || going.current) return;
    going.current = true;
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
    if (!draft.sendAmount && !draft.receiveAmount) return;
    api
      .quote(draft.corridorId, draft.receiveAmount ?? draft.sendAmount, draft.receiveAmount ? "receive" : "send", recipient?.network)
      .then((q) => {
        setQuote(q);
        // Le paiement et le reçu reprennent ce devis à jour.
        setDraft({ quote: q });
      })
      .catch((e: Error) => setError(e.message));
  }, [draft.corridorId, draft.sendAmount, draft.receiveAmount, recipient?.network, setDraft]);

  if (!recipient) return <Redirect href="/(tabs)" />;

  return (
    <Screen
      footer={
        <View style={{ gap: 6 }}>
          <Button
            title={quote ? `${method === "interac" ? tr("Payer par Interac") : tr("Payer")} ${money(quote.total, quote.sendCurrency)}` : tr("Payer")}
            icon="lock"
            onPress={next}
            disabled={!quote || !method}
          />
          <Small style={{ textAlign: "center" }}>{tr("Paiement sécurisé · reçu envoyé par courriel")}</Small>
        </View>
      }
    >
      <Header title={tr("Vérification")} />
      <Steps current={3} total={3} label={tr("Paiement")} names={SEND_STEPS} />

      <Card style={{ alignItems: "center", marginBottom: 14, backgroundColor: colors.navy, borderColor: colors.navy }}>
        <Text style={{ color: colors.silver, fontFamily: fonts.heading, fontSize: 12, letterSpacing: 0.8 }}>{tr("{0} REÇOIT", recipient.fullName.toUpperCase())}</Text>
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
            <SummaryRow label={tr("Vous envoyez")} value={money(quote.sendAmount, quote.sendCurrency)} />
            <SummaryRow label={tr("Taux de change")} value={rateLine(quote.rate, quote.sendCurrency, quote.receiveCurrency)} />
            <SummaryRow label={tr("Frais")} value={feeLabel(quote.fee, quote.sendCurrency)} />
            <Divider />
            <SummaryRow label={tr("Total à payer")} value={money(quote.total, quote.sendCurrency)} strong />
            <SummaryRow label={tr("Délai estimé")} value={etaLabel(deliveryEstimate(quote.deliveryEstimate, recipient.network))} />
            {quote.fee === 0 ? (
              <Small style={{ marginTop: 8 }}>{tr("Sans frais d'envoi : notre rémunération est déjà comprise dans le taux de change affiché.")}</Small>
            ) : null}
          </>
        ) : (
          <Small>{tr("Calcul du devis…")}</Small>
        )}
      </Card>

      <H1 style={{ fontSize: 18, marginBottom: 10 }}>{tr("Payer avec")}</H1>
      {interacOk ? (
        <Choice
          leading={<PaymentLogo id="INTERAC" size={22} />}
          label={tr("Virement Interac")}
          description={tr("Le moins cher · depuis votre appli bancaire")}
          selected={method === "interac"}
          onPress={() => setDraft({ payMethod: "interac" })}
        />
      ) : null}
      {cardOk ? (
        <Choice
          leading={
            <View style={{ flexDirection: "row", gap: 4 }}>
              <PaymentLogo id="VISA" size={22} />
              <PaymentLogo id="MASTERCARD" size={22} />
            </View>
          }
          label={tr("Carte de débit")}
          description={tr("Visa Débit, Mastercard Débit · cartes de crédit non acceptées")}
          selected={method === "card"}
          onPress={() => setDraft({ payMethod: "card" })}
        />
      ) : null}
      {!method ? (
        <Notice tone="warn" icon="info" text={tr("Aucun moyen de paiement n'est encore ouvert pour ce trajet. Les envois partent pour l'instant du Canada, par virement Interac.")} />
      ) : null}
      {error ? <Notice tone="danger" icon="alert" text={error} /> : null}
      <View style={{ marginTop: 14 }}>
        <Notice
          tone="brand"
          icon="shield"
          title={tr("Votre argent est protégé")}
          text={tr("Taux et frais sont bloqués dès la création du transfert. Si le versement ne peut pas aboutir, nous annulons le transfert et vous remboursons votre virement.")}
        />
      </View>
    </Screen>
  );
}
