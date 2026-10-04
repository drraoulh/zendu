import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { WstSymbol } from "@/components/brand";
import { Icon, type IconName } from "@/components/icons";
import { Simulator } from "@/components/simulator";
import { TransferRow } from "@/components/transfer-row";
import { Button, Card, Empty, H2, IconButton, Notice, Screen, Small } from "@/components/ui";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";
import { colors, fonts, radius } from "@/lib/theme";
import { useMyTransfers } from "@/lib/use-transfers";

export default function Home() {
  const { profile } = useSession();
  const { draft, setDraft } = useStore();
  const { items, loading } = useMyTransfers(3);
  const kycDone = profile?.kyc === "verified";

  function startSend() {
    if (!kycDone) return router.push("/kyc");
    router.push("/send/recipient");
  }

  return (
    <Screen edges={["top"]}>
      <View style={st.top}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
          <WstSymbol size={36} />
          <View style={{ flex: 1 }}>
            <Small>Bonjour</Small>
            <Text style={st.hello} numberOfLines={1}>{profile?.firstName ?? ""}</Text>
          </View>
        </View>
        <IconButton name="bell" label="Notifications" onPress={() => router.push("/(tabs)/history")} />
      </View>

      {!kycDone ? (
        <Card onPress={() => router.push("/kyc")} style={{ marginBottom: 16, backgroundColor: colors.warnSoft, borderColor: colors.warnSoft }}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Icon name="shield" color={colors.warn} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.heading, color: colors.ink }}>Vérifiez votre identité</Text>
              <Small>Obligatoire avant votre premier transfert · 3 min</Small>
            </View>
            <Icon name="chev" color={colors.warn} size={18} />
          </View>
        </Card>
      ) : null}

      <Simulator
        corridorId={draft.corridorId}
        amount={draft.sendAmount}
        onChange={(n) => setDraft(n)}
        onContinue={startSend}
        ctaLabel="Envoyer maintenant"
      />

      <View style={st.actions}>
        <Action icon="send" label="Envoyer" onPress={startSend} />
        <Action icon="history" label="Suivi" onPress={() => router.push("/(tabs)/history")} />
        <Action icon="user" label="Bénéficiaires" onPress={() => router.push("/recipients")} />
        <Action icon="grid" label="Services" onPress={() => router.push("/(tabs)/discover")} />
      </View>

      <View style={st.sectionHead}>
        <H2 style={{ fontSize: 18 }}>Derniers transferts</H2>
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

      <View style={{ marginTop: 16 }}>
        <Notice tone="brand" icon="lock" text="Vos paiements sont chiffrés et vos transferts suivis à chaque étape." />
      </View>
    </Screen>
  );
}

function Action({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [st.action, pressed && { opacity: 0.8 }]}>
      <View style={st.actionIcon}>
        <Icon name={icon} color={colors.brand} />
      </View>
      <Text style={st.actionLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18, marginTop: 4 },
  hello: { fontFamily: fonts.display, fontSize: 22, color: colors.navy },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 18, gap: 8 },
  action: { flex: 1, alignItems: "center", gap: 6 },
  actionIcon: { width: 54, height: 54, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 10 },
  link: { color: colors.brand, fontFamily: fonts.semibold, fontSize: 14 },
});
