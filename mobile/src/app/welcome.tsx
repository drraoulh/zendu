import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PoweredBy, WstSymbol, WstWordmark } from "@/components/brand";
import { Flag } from "@/components/flag";
import { Icon, type IconName } from "@/components/icons";
import { Button } from "@/components/ui";
import { useSession } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";

const SLIDES: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "send",
    // Mode réel : les envois partent du Canada (virement Interac) ; ne pas annoncer d'autres départs.
    title: "Envoyez de l'argent du Canada vers le Cameroun et la Chine",
    text: "Payez par virement Interac. Votre proche reçoit sur Mobile Money (MTN, Orange), Alipay, WeChat Pay ou son compte bancaire.",
  },
  {
    icon: "eye",
    title: "Des frais clairs, un suivi en temps réel",
    text: "Aucun frais vers le Cameroun, un petit frais fixe vers la Chine. Le taux et le montant reçu sont affichés avant de payer, puis chaque étape jusqu'à la réception.",
  },
  {
    icon: "ship",
    title: "Suivez aussi vos colis",
    text: "Vous expédiez avec PWFINTECH ? Suivez votre colis étape par étape avec son numéro de suivi, directement dans l'appli.",
  },
];

export default function Welcome() {
  const [index, setIndex] = useState(0);
  const { finishOnboarding } = useSession();
  const { height } = useWindowDimensions();
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;
  // Écran court (320×568) : le grand logo repoussait le bouton « Suivant » hors de l'écran.
  // On ne garde alors que les drapeaux, sans pastille d'icône, avec un titre plus petit.
  const compact = height < 640;
  // Écran moyen (375×667) : logo réduit et pas de pastille d'icône, pour que la mention PWFINTECH reste visible.
  const short = height < 760;

  function go(path: "/auth/signup" | "/auth/login") {
    void finishOnboarding();
    router.push(path);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.navy }}>
      <View style={st.top}>
        <WstWordmark size={28} negative />
        {!last ? (
          <Pressable accessibilityRole="button" onPress={() => setIndex(SLIDES.length - 1)} hitSlop={10}>
            <Text style={st.skip}>Passer</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[st.hero, compact ? { minHeight: 0, paddingVertical: 12 } : short ? { minHeight: 0, gap: 14 } : { minHeight: Math.min(320, height * 0.36) }]}>
        {compact ? null : (
          <View style={[st.halo, short && { width: 120, height: 120, borderRadius: 60 }]}>
            <WstSymbol size={short ? 72 : 110} negative />
          </View>
        )}
        <View style={st.flags}>
          {["CA", "CM", "CN"].map((c) => (
            <View key={c} style={st.flagPill}>
              <Flag code={c} size={22} />
            </View>
          ))}
        </View>
      </View>

      <View style={st.sheet}>
        {/* Tablette : contenu centré sur 640 px au lieu de boutons étirés sur toute la largeur. */}
        <View style={st.sheetInner}>
          {short ? null : (
            <View style={st.iconWrap}>
              <Icon name={slide.icon} color={colors.brand} size={24} />
            </View>
          )}
          <Text style={[st.title, compact && { fontSize: 21, lineHeight: 26 }]} accessibilityRole="header">{slide.title}</Text>
          <Text style={st.text}>{slide.text}</Text>

          <View style={[st.dots, compact && { marginVertical: 14 }]} accessibilityLabel={`Écran ${index + 1} sur ${SLIDES.length}`}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[st.dot, i === index && st.dotOn]} />
            ))}
          </View>

          {last ? (
            <View style={{ gap: 10 }}>
              <Button title="Créer un compte" onPress={() => go("/auth/signup")} />
              <Button title="J'ai déjà un compte" variant="secondary" onPress={() => go("/auth/login")} />
            </View>
          ) : (
            <Button title="Suivant" onPress={() => setIndex(index + 1)} />
          )}
          <View style={{ alignItems: "center", marginTop: compact ? 10 : 16 }}>
            <PoweredBy />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 8 },
  skip: { color: "rgba(255,255,255,0.8)", fontFamily: fonts.semibold, fontSize: 14 },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", gap: 22 },
  halo: { width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(63,160,255,0.14)", alignItems: "center", justifyContent: "center" },
  flags: { flexDirection: "row", gap: 10 },
  flagPill: { padding: 6, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.1)" },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 20 },
  sheetInner: { width: "100%", maxWidth: 640, alignSelf: "center" },
  iconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: colors.navy, letterSpacing: -0.4 },
  text: { fontSize: 15, lineHeight: 22, color: colors.muted, marginTop: 8 },
  dots: { flexDirection: "row", gap: 6, marginVertical: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line },
  dotOn: { width: 24, backgroundColor: colors.brand },
});
