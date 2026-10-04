import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PoweredBy, WstSymbol } from "@/components/brand";
import { SectionTitle } from "@/components/form";
import { Icon, type IconName } from "@/components/icons";
import { Card, H1, P, Screen, Small } from "@/components/ui";
import { colors, fonts, radius } from "@/lib/theme";

const POLES: { icon: IconName; title: string; text: string; href: Href }[] = [
  { icon: "finance", title: "Finances", text: "Budget, épargne et accompagnement des PME.", href: "/services/finances" },
  { icon: "tech", title: "Technologies", text: "Sites web, applis et solutions de paiement.", href: "/services/technologies" },
  { icon: "ship", title: "Shipping", text: "Vos colis entre le Canada, le Cameroun et la Chine, par avion ou bateau.", href: "/services/shipping" },
];

export default function Discover() {
  return (
    <Screen edges={["top"]}>
      <Small style={{ marginTop: 8, fontFamily: fonts.heading, color: colors.brand, letterSpacing: 0.8 }}>PWFINTECH</Small>
      <H1 style={{ marginTop: 4 }}>Découvrir PWFINTECH</H1>
      <P style={{ marginTop: 6, marginBottom: 18 }}>
        WorldSoft Transfer est l&apos;application de transfert d&apos;argent de PWFINTECH — Paul World Finances and Technologies.
      </P>

      <Card style={{ flexDirection: "row", gap: 14, alignItems: "center", backgroundColor: colors.navy, borderColor: colors.navy }}>
        <WstSymbol size={44} negative />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.white, fontFamily: fonts.heading, fontSize: 16 }}>Vous êtes sur WorldSoft Transfer</Text>
          <Small style={{ color: "rgba(255,255,255,0.75)" }}>Le transfert d&apos;argent entre le Canada, le Cameroun et la Chine.</Small>
        </View>
      </Card>

      <SectionTitle>Les autres pôles PWFINTECH</SectionTitle>
      <View style={{ gap: 12 }}>
        {POLES.map((p) => (
          <Pressable key={p.title} accessibilityRole="button" onPress={() => router.push(p.href)} style={({ pressed }) => [st.pole, pressed && { opacity: 0.85 }]}>
            <View style={st.icon}>
              <Icon name={p.icon} color={colors.brand} size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.title}>{p.title}</Text>
              <Small>{p.text}</Small>
            </View>
            <Icon name="chev" color={colors.muted} size={18} />
          </Pressable>
        ))}
      </View>

      <View style={{ alignItems: "center", marginTop: 28 }}>
        <PoweredBy />
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  pole: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 16 },
  icon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.heading, fontSize: 16, color: colors.ink, marginBottom: 2 },
});
