import { router, type Href } from "expo-router";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { WstSymbol } from "@/components/brand";
import { Icon, type IconName } from "@/components/icons";
import { Simulator } from "@/components/simulator";
import { TransferRow } from "@/components/transfer-row";
import { Button, Card, Empty, H2, Screen, Small } from "@/components/ui";
import { defaultCorridorFor, SAMPLE_AMOUNT } from "@/lib/corridors";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";
import { colors, fonts, radius } from "@/lib/theme";
import { useNotifications } from "@/lib/use-notifications";
import { useMyTransfers } from "@/lib/use-transfers";

const POLES: { icon: IconName; label: string; href: Href }[] = [
  { icon: "finance", label: "Finances", href: "/services/finances" },
  { icon: "tech", label: "Technologies", href: "/services/technologies" },
  { icon: "ship", label: "Shipping", href: "/services/shipping" },
];

export default function Home() {
  const { profile } = useSession();
  const { draft, setDraft } = useStore();
  const { items, loading } = useMyTransfers(3);
  const { unread } = useNotifications();
  const kyc = profile?.kyc ?? "none";
  // Écrans étroits (iPhone SE 1re gén.) : « Technologies » ne tient pas sur un tiers de largeur.
  const narrow = useWindowDimensions().width < 360;

  // Premier affichage pour ce compte : trajet au départ de son pays de résidence.
  const seeded = useRef<string | null>(null);
  useEffect(() => {
    if (!profile || seeded.current === profile.id) return;
    seeded.current = profile.id;
    const corridorId = defaultCorridorFor(profile.country);
    if (!draft.corridorId.startsWith(`${profile.country}-`)) {
      const currency = { CA: "CAD", CM: "XAF", CN: "CNY" }[profile.country] ?? "CAD";
      setDraft({ corridorId, sendAmount: SAMPLE_AMOUNT[currency] ?? 200, quote: null });
    }
  }, [profile, draft.corridorId, setDraft]);
  const todo = kyc === "none" || kyc === "rejected";

  function startSend() {
    if (todo) return router.push("/kyc");
    if (kyc === "pending") return router.push("/(tabs)/send");
    router.push("/send/recipient");
  }

  return (
    <Screen edges={["top"]}>
      <View style={st.top}>
        <WstSymbol size={34} />
        <Pressable accessibilityRole="button" accessibilityLabel={`Notifications, ${unread.length} non lues`} onPress={() => router.push("/notifications")} style={st.bell}>
          <Icon name="bell" color={colors.ink} size={20} />
          {unread.length ? (
            <View style={st.badge}>
              <Text style={st.badgeText}>{unread.length > 9 ? "9+" : unread.length}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
      <Text style={st.hello}>Bonjour {profile?.firstName}</Text>
      <Small style={{ marginBottom: 16 }}>À qui envoyez-vous aujourd&apos;hui ?</Small>

      {kyc !== "verified" ? (
        <Card
          onPress={todo ? () => router.push("/kyc") : undefined}
          style={{ marginBottom: 16, backgroundColor: kyc === "rejected" ? colors.dangerSoft : colors.warnSoft, borderColor: kyc === "rejected" ? colors.dangerSoft : colors.warnSoft }}
        >
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Icon name={kyc === "pending" ? "clock" : kyc === "rejected" ? "alert" : "shield"} color={kyc === "rejected" ? colors.danger : colors.warn} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.heading, color: colors.ink }}>{kyc === "none" ? "Vérifiez votre identité" : kyc === "rejected" ? "Vérification refusée" : "Vérification en cours"}</Text>
              <Small>{kyc === "none"
                  ? "Obligatoire avant votre premier transfert · 2 min"
                  : kyc === "rejected"
                    ? profile?.kycNote ?? "Recommencez avec un document valide."
                    : "Généralement quelques minutes. Vous serez averti."}</Small>
            </View>
            {todo ? <Icon name="chev" color={kyc === "rejected" ? colors.danger : colors.warn} size={18} /> : null}
          </View>
        </Card>
      ) : null}

      <Simulator key={draft.corridorId.split("-")[0]} corridorId={draft.corridorId} amount={draft.sendAmount} onChange={(n) => setDraft(n)} onContinue={startSend} ctaLabel="Envoyer" />

      <View style={st.sectionHead}>
        <H2 style={{ fontSize: 18 }}>Découvrir PWFINTECH</H2>
        <Pressable onPress={() => router.push("/(tabs)/discover")} hitSlop={8}>
          <Text style={st.link}>En savoir plus</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: narrow ? "column" : "row", gap: narrow ? 8 : 10 }}>
        {POLES.map((p) => (
          <Pressable
            key={p.label}
            accessibilityRole="button"
            onPress={() => router.push(p.href)}
            style={({ pressed }) => [st.pole, narrow && st.poleRow, pressed && { opacity: 0.85 }]}
          >
            <View style={st.poleIcon}>
              <Icon name={p.icon} color={colors.brand} />
            </View>
            <Text style={[st.poleLabel, narrow && { flex: 1, fontSize: 14 }]} numberOfLines={1}>{p.label}</Text>
            {narrow ? <Icon name="chev" color={colors.muted} size={18} /> : null}
          </Pressable>
        ))}
      </View>

      <View style={st.sectionHead}>
        <H2 style={{ fontSize: 18 }}>Transferts récents</H2>
        {items.length ? (
          <Pressable onPress={() => router.push("/(tabs)/history")} hitSlop={8}>
            <Text style={st.link}>Tout voir</Text>
          </Pressable>
        ) : null}
      </View>
      <Card style={{ paddingVertical: 6 }}>
        {items.length ? (
          items.map((t) => <TransferRow key={t.id} transfer={t} />)
        ) : loading ? (
          <Small style={{ padding: 12 }}>Chargement…</Small>
        ) : (
          <Empty
            icon="send"
            title="Aucun transfert pour l'instant"
            text="Vos envois apparaîtront ici avec leur suivi en temps réel."
            action={<Button title="Faire mon premier envoi" size="sm" variant="secondary" onPress={startSend} />}
          />
        )}
      </Card>
    </Screen>
  );
}

const st = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4, marginBottom: 14 },
  bell: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.maple, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { color: colors.white, fontSize: 10, fontFamily: fonts.heading },
  hello: { fontFamily: fonts.display, fontSize: 26, color: colors.navy },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 10 },
  link: { color: colors.brand, fontFamily: fonts.semibold, fontSize: 14 },
  pole: { flex: 1, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 10, gap: 8, alignItems: "flex-start" },
  poleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  poleIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  poleLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink },
});
