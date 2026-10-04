import { Redirect, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Icon } from "@/components/icons";
import { Button, Card, H1, Notice, P, Screen, Small } from "@/components/ui";
import { api } from "@/lib/api";
import { cardLabel } from "@/lib/cards";
import { money, networkLabel } from "@/lib/format";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";

type Phase = 0 | 1 | 2 | 3;

export default function Processing() {
  const { profile } = useSession();
  const { draft, cards, addTransfer } = useStore();
  const [phase, setPhase] = useState<Phase>(0);
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const card = cards.find((c) => c.id === draft.cardId);
  const recipient = draft.recipient;
  const quote = draft.quote;

  useEffect(() => {
    if (started.current || !recipient || !profile || !quote) return;
    started.current = true;
    void (async () => {
      try {
        await new Promise((r) => setTimeout(r, 700));
        setPhase(1);
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
        setReference(transfer.reference);
        addTransfer({ id: transfer.id, reference: transfer.reference, createdAt: transfer.createdAt });
        setPhase(2);
        if (payIn.provider === "stripe" && payIn.checkoutUrl) {
          await WebBrowser.openBrowserAsync(payIn.checkoutUrl);
          router.dismissAll();
          router.replace({ pathname: "/transfer/[id]", params: { id: transfer.id, created: "1" } });
          return;
        }
        await api.simulatePay(transfer.id);
        setPhase(3);
        await new Promise((r) => setTimeout(r, 600));
        router.dismissAll();
        router.replace({ pathname: "/send/success", params: { id: transfer.id, card: card ? cardLabel(card) : "" } });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Paiement impossible");
      }
    })();
  }, [recipient, profile, quote, draft.corridorId, draft.sendAmount, addTransfer, card]);

  if (!recipient || !quote) return <Redirect href="/(tabs)" />;

  const steps = [
    { title: "Autorisation de la carte", sub: `${card ? cardLabel(card) : "Carte"} · ${money(quote.total, quote.sendCurrency)}` },
    { title: "Création du transfert", sub: phase > 1 ? "Créé" : phase === 1 ? "En cours…" : "À venir" },
    { title: `Envoi vers ${networkLabel(recipient.network)}`, sub: phase > 2 ? "Lancé" : phase === 2 ? "En cours…" : "À venir" },
  ];

  return (
    <Screen>
      <View style={{ alignItems: "center", paddingTop: 50, gap: 10 }}>
        {error ? <Icon name="alert" size={48} color={colors.danger} /> : <ActivityIndicator size="large" color={colors.brand} />}
        <H1 style={{ textAlign: "center" }}>{error ? "Paiement interrompu" : "Traitement du paiement"}</H1>
        <P style={{ textAlign: "center" }}>{error ? "Aucun montant n'a été débité." : "Ne fermez pas l'application. Cela prend généralement quelques secondes."}</P>
      </View>
      <Card style={{ marginTop: 24 }}>
        {steps.map((s, i) => {
          const done = phase > i;
          const current = phase === i && !error;
          return (
            <View key={s.title} style={{ flexDirection: "row", gap: 12, alignItems: "center", paddingVertical: 10 }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: done ? colors.success : current ? colors.brandSoft : colors.bg,
                }}
              >
                {done ? <Icon name="check" color={colors.white} size={14} strokeWidth={3} /> : current ? <ActivityIndicator size="small" color={colors.brand} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.semibold, color: colors.ink, fontSize: 15 }}>{s.title}</Text>
                <Small>{s.sub}</Small>
              </View>
            </View>
          );
        })}
      </Card>
      {reference ? <Small style={{ textAlign: "center", marginTop: 12 }}>Réf. {reference}</Small> : null}
      {error ? (
        <View style={{ marginTop: 16, gap: 10 }}>
          <Notice tone="danger" icon="alert" text={error} />
          <Button title="Revenir au récapitulatif" onPress={() => router.back()} />
        </View>
      ) : null}
    </Screen>
  );
}
