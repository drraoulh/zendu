import { Redirect, router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Icon } from "@/components/icons";
import { Button, Card, Choice, H1, Header, Notice, Screen, Small, SEND_STEPS, Steps, SummaryRow } from "@/components/ui";
import { api, type Quote } from "@/lib/api";
import { deliveryEstimate, etaLabel, feeLabel, money, networkLabel, phone, rateLine } from "@/lib/format";
import { findCorridor, payMethodsOf, useCorridors } from "@/lib/corridors";
import { useStore } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";
import { PaymentLogo } from "@/components/payment-logo";
import { tr } from "@/lib/i18n";

export default function Review() {
  const { draft, setDraft } = useStore();
  const [quote, setQuote] = useState<Quote | null>(draft.quote);
  const [error, setError] = useState<string | null>(null);
  const [tryN, setTryN] = useState(0);
  const recipient = draft.recipient;
  // Moyens ouverts par le serveur pour ce trajet (Interac : envois en dollars canadiens ; carte :
  // seulement en démonstration tant qu'aucun prestataire de carte n'est branché).
  const methods = payMethodsOf(findCorridor(useCorridors(), draft.corridorId));
  const interacOk = methods.includes("interac") && (quote ? quote.sendCurrency === "CAD" : draft.corridorId.startsWith("CA-"));
  const cardOk = methods.includes("card");
  const manualOk = methods.includes("manual");
  const method =
    draft.payMethod === "manual" && manualOk ? "manual" : draft.payMethod === "card" && cardOk ? "card" : interacOk ? "interac" : manualOk ? "manual" : cardOk ? "card" : null;

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
    if (method === "interac" || method === "manual") {
      setDraft({ payMethod: method, cardId: null });
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
      .then(() => setError(null))
      .catch((e: Error) => {
        // Devis impossible à rafraîchir : on ne laisse pas payer sur un ancien montant.
        setQuote(null);
        setError(e.message);
      });
  }, [draft.corridorId, draft.sendAmount, draft.receiveAmount, recipient?.network, setDraft, tryN]);

  if (!recipient) return <Redirect href="/(tabs)" />;

  return (
    <Screen
      footer={
        <View style={{ gap: 6 }}>
          <Button
            title={quote ? `${method === "interac" ? tr("Payer par Interac") : method === "manual" ? tr("Continuer") : tr("Payer")} ${money(quote.total, quote.sendCurrency)}` : tr("Payer")}
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

      {/* Ce qui compte : combien je paie, combien il reçoit, puis les détails. */}
      <Card style={{ alignItems: "center", marginBottom: 14, backgroundColor: colors.soft, borderColor: colors.line, paddingVertical: 22 }}>
        <Text style={{ color: colors.muted, fontFamily: fonts.medium, fontSize: 12, letterSpacing: 0 }}>{tr("Vous payez")}</Text>
        <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 36, letterSpacing: -0.8, marginTop: 4 }} numberOfLines={1} adjustsFontSizeToFit>
          {quote ? money(quote.total, quote.sendCurrency) : "…"}
        </Text>
        <Text style={{ color: colors.ink, fontFamily: fonts.medium, fontSize: 15, marginTop: 8, textAlign: "center" }}>
          {tr("{0} reçoit {1}", recipient.fullName, quote ? money(quote.receiveAmount, quote.receiveCurrency) : "…")}
        </Text>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <SummaryRow
          label={tr("Destinataire")}
          value={`${networkLabel(recipient.network)}${recipient.phone ? ` · ${phone(recipient.phone)}` : recipient.bankName ? ` · ${recipient.bankName}` : ""}`}
          valueIcon={<PaymentLogo id={recipient.network} size={20} />}
        />
        {quote ? (
          <>
            {quote.fee > 0 ? <SummaryRow label={tr("Vous envoyez")} value={money(quote.sendAmount, quote.sendCurrency)} /> : null}
            <SummaryRow label={tr("Taux de change")} value={rateLine(quote.rate, quote.sendCurrency, quote.receiveCurrency)} />
            <SummaryRow label={tr("Frais")} value={feeLabel(quote.fee, quote.sendCurrency)} />
            <SummaryRow label={tr("Délai estimé")} value={etaLabel(deliveryEstimate(quote.deliveryEstimate, recipient.network))} />
            {quote.fee === 0 ? (
              <Small style={{ marginTop: 8 }}>{tr("Sans frais d'envoi : notre rémunération est déjà comprise dans le taux de change affiché.")}</Small>
            ) : null}
          </>
        ) : (
          <Small style={{ marginTop: 6 }}>{tr("Calcul du devis…")}</Small>
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
      {manualOk ? (
        <Choice
          label={tr("Paiement manuel")}
          description={tr("Vous envoyez l'argent vous-même · confirmé par notre équipe")}
          selected={method === "manual"}
          onPress={() => setDraft({ payMethod: "manual" })}
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
      {error ? (
        <View style={{ gap: 8 }}>
          <Notice tone="danger" icon="alert" text={error} />
          <Button title={tr("Réessayer")} variant="secondary" onPress={() => setTryN((n) => n + 1)} />
        </View>
      ) : null}
      <View style={{ marginTop: 14, gap: 10, padding: 14, borderRadius: 14, backgroundColor: colors.brandSoft }}>
        <Text style={{ fontFamily: fonts.heading, fontSize: 14, color: colors.brand }}>{tr("Votre argent est protégé")}</Text>
        {[
          tr("Taux et frais bloqués dès la création du transfert"),
          tr("Remboursé en entier si le versement ne peut pas aboutir"),
          tr("Reçu envoyé par courriel après le paiement"),
        ].map((line) => (
          <View key={line} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
            <Icon name="check" color={colors.brand} size={16} strokeWidth={2.4} />
            <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.ink }}>{line}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}
