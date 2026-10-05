import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Flag } from "@/components/flag";
import { Avatar } from "@/components/form";
import { Icon } from "@/components/icons";
import { Simulator } from "@/components/simulator";
import { TransferRow } from "@/components/transfer-row";
import { Card, Screen, Small } from "@/components/ui";
import { defaultCorridorFor, SAMPLE_AMOUNT } from "@/lib/corridors";
import { corridorFor } from "@/lib/recipients";
import { useSession } from "@/lib/session";
import { useStore, type Recipient } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";
import { useNotifications } from "@/lib/use-notifications";
import { useMyTransfers } from "@/lib/use-transfers";

/**
 * Accueil, inspiré des applis de transfert les plus simples : un convertisseur, un bouton,
 * les proches à qui renvoyer en un geste et l'activité récente. Rien d'autre.
 */
export default function Home() {
  const { profile } = useSession();
  const { draft, setDraft, recipients } = useStore();
  const { items, loading } = useMyTransfers(3);
  const { unread } = useNotifications();
  const kyc = profile?.kyc ?? "none";
  const todo = kyc === "none" || kyc === "rejected";
  const home = profile?.country ?? "CA";
  const selected = draft.recipient && draft.corridorId.endsWith(`-${draft.recipient.country}`) ? draft.recipient : null;

  // Premier affichage pour ce compte : trajet au départ de son pays de résidence.
  const seeded = useRef<string | null>(null);
  useEffect(() => {
    if (!profile || seeded.current === profile.id) return;
    seeded.current = profile.id;
    if (!draft.corridorId.startsWith(`${profile.country}-`)) {
      const currency = { CA: "CAD", CM: "XAF", CN: "CNY" }[profile.country] ?? "CAD";
      setDraft({ corridorId: defaultCorridorFor(profile.country), sendAmount: SAMPLE_AMOUNT[currency] ?? 200, quote: null });
    }
  }, [profile, draft.corridorId, setDraft]);

  function startSend() {
    if (todo) return router.push("/kyc");
    if (kyc === "pending") return;
    router.push(selected ? "/send/review" : "/send/recipient");
  }

  function pickRecipient(r: Recipient) {
    if (selected?.id === r.id) return setDraft({ recipient: null });
    const corridorId = corridorFor(home, r);
    const sameCurrency = corridorId.split("-")[0] === draft.corridorId.split("-")[0];
    setDraft({ recipient: r, corridorId, quote: null, ...(sameCurrency ? {} : { sendAmount: SAMPLE_AMOUNT[{ CA: "CAD", CM: "XAF", CN: "CNY" }[home] ?? "CAD"] ?? 200 }) });
  }

  return (
    <Screen edges={["top"]}>
      <View style={st.top}>
        <Text style={st.hello} numberOfLines={1}>Bonjour {profile?.firstName}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Notifications, ${unread.length} non lues`} onPress={() => router.push("/notifications")} style={st.bell}>
          <Icon name="bell" color={colors.ink} size={20} />
          {unread.length ? (
            <View style={st.badge}>
              <Text style={st.badgeText}>{unread.length > 9 ? "9+" : unread.length}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {kyc !== "verified" ? (
        <Card
          onPress={todo ? () => router.push("/kyc") : undefined}
          style={[st.kyc, { backgroundColor: kyc === "rejected" ? colors.dangerSoft : colors.warnSoft, borderColor: kyc === "rejected" ? colors.dangerSoft : colors.warnSoft }]}
        >
          <Icon name={kyc === "pending" ? "clock" : kyc === "rejected" ? "alert" : "shield"} color={kyc === "rejected" ? colors.danger : colors.warn} size={20} />
          <View style={{ flex: 1 }}>
            <Text style={st.kycTitle}>{kyc === "none" ? "Vérifiez votre identité" : kyc === "rejected" ? "Vérification refusée" : "Vérification en cours"}</Text>
            <Small>
              {kyc === "none"
                ? "Obligatoire avant votre premier envoi · 2 min"
                : kyc === "rejected"
                  ? profile?.kycNote ?? "Recommencez avec un document valide."
                  : "Vous pourrez envoyer dès qu'elle sera confirmée."}
            </Small>
          </View>
          {todo ? <Icon name="chev" color={kyc === "rejected" ? colors.danger : colors.warn} size={18} /> : null}
        </Card>
      ) : null}

      <Simulator
        key={draft.corridorId.split("-")[0]}
        corridorId={draft.corridorId}
        amount={draft.sendAmount}
        onChange={(n) => setDraft(selected && !n.corridorId.endsWith(`-${selected.country}`) ? { ...n, recipient: null } : n)}
        onContinue={kyc === "pending" ? undefined : startSend}
        ctaLabel={todo ? "Vérifier mon identité" : selected ? `Envoyer à ${selected.fullName.split(" ")[0]}` : "Envoyer"}
      />

      <Text style={st.section}>Envoyer à nouveau</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.people}>
        <Pressable accessibilityRole="button" accessibilityLabel="Nouveau destinataire" onPress={() => router.push(todo ? "/kyc" : "/send/recipient")} style={st.person}>
          <View style={st.add}>
            <Icon name="plus" color={colors.brand} size={22} />
          </View>
          <Text style={st.personName} numberOfLines={1}>Nouveau</Text>
        </Pressable>
        {recipients.slice(0, 10).map((r) => {
          const on = selected?.id === r.id;
          return (
            <Pressable
              key={r.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Envoyer à ${r.fullName}`}
              onPress={() => pickRecipient(r)}
              style={st.person}
            >
              <View style={[st.avatarRing, on && { borderColor: colors.brand }]}>
                <Avatar name={r.fullName} size={52} tone={on ? "brand" : "soft"} />
                <View style={st.flagDot}>
                  <Flag code={r.country} size={16} />
                </View>
              </View>
              <Text style={[st.personName, on && { color: colors.brand }]} numberOfLines={1}>
                {r.fullName.split(" ")[0]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={st.sectionRow}>
        <Text style={[st.section, { marginTop: 0 }]}>Activité récente</Text>
        {items.length ? (
          <Pressable onPress={() => router.push("/(tabs)/history")} hitSlop={8}>
            <Text style={st.link}>Tout voir</Text>
          </Pressable>
        ) : null}
      </View>
      {items.length ? (
        <Card style={{ paddingVertical: 4 }}>
          {items.map((t) => (
            <TransferRow key={t.id} transfer={t} />
          ))}
        </Card>
      ) : (
        <Small style={{ paddingHorizontal: 4 }}>{loading ? "Chargement…" : "Vos envois apparaîtront ici, avec leur suivi en temps réel."}</Small>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 4, marginBottom: 16 },
  hello: { flex: 1, fontFamily: fonts.display, fontSize: 24, color: colors.navy },
  bell: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.maple, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { color: colors.white, fontSize: 10, fontFamily: fonts.heading },
  kyc: { marginBottom: 14, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  kycTitle: { fontFamily: fonts.heading, color: colors.ink, fontSize: 14 },
  section: { fontFamily: fonts.heading, fontSize: 17, color: colors.ink, marginTop: 24, marginBottom: 12 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 12 },
  link: { color: colors.brand, fontFamily: fonts.semibold, fontSize: 14 },
  people: { gap: 14, paddingRight: 8 },
  person: { width: 64, alignItems: "center", gap: 6 },
  add: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.brand, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  avatarRing: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: "transparent", alignItems: "center", justifyContent: "center" },
  flagDot: { position: "absolute", right: -2, bottom: -2, borderRadius: 4, borderWidth: 2, borderColor: colors.bg },
  personName: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink, maxWidth: 64 },
});
