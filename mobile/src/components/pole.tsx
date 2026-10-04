import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius } from "@/lib/theme";
import { Icon, type IconName } from "./icons";
import { Small } from "./ui";

/** En-tête d'un pôle PWFINTECH (Finances, Technologies, Shipping). */
export function PoleHero({ label, title, text, icon }: { label: string; title: string; text: string; icon: IconName }) {
  return (
    <View style={p.hero}>
      <View style={p.heroIcon}>
        <Icon name={icon} color={colors.white} size={26} />
      </View>
      <Text style={p.label}>{label}</Text>
      <Text style={p.title} accessibilityRole="header">{title}</Text>
      <Text style={p.text}>{text}</Text>
    </View>
  );
}

export function Offer({ icon, title, text, right }: { icon: IconName; title: string; text: string; right?: ReactNode }) {
  return (
    <View style={p.offer}>
      <View style={p.offerIcon}>
        <Icon name={icon} color={colors.brand} size={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={p.offerTitle}>{title}</Text>
        <Small>{text}</Small>
      </View>
      {right}
    </View>
  );
}

const p = StyleSheet.create({
  hero: { backgroundColor: colors.navy, borderRadius: radius.xl, padding: 22, marginBottom: 18 },
  heroIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  label: { color: colors.sky, fontFamily: fonts.heading, fontSize: 12, letterSpacing: 1 },
  title: { color: colors.white, fontFamily: fonts.display, fontSize: 24, lineHeight: 30, marginTop: 6 },
  text: { color: "rgba(255,255,255,0.78)", fontSize: 14, lineHeight: 20, marginTop: 8 },
  offer: { flexDirection: "row", gap: 12, alignItems: "flex-start", paddingVertical: 12 },
  offerIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  offerTitle: { fontFamily: fonts.heading, fontSize: 15, color: colors.ink, marginBottom: 2 },
});
