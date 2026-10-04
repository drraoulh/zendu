import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { colors, fonts } from "@/lib/theme";
import { Icon } from "./icons";

/** Pavé numérique pour le code PIN de l'appli. */
export function PinPad({ value, length = 6, onChange, extra }: { value: string; length?: number; onChange: (v: string) => void; extra?: { label: string; onPress: () => void } }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "extra", "0", "del"];
  // Touches plus petites sur les écrans courts (iPhone SE : 568 px), sinon le « 0 » sort de l'écran.
  const short = useWindowDimensions().height < 700;
  const size = short ? 62 : 76;
  const gap = short ? 14 : 18;
  const keyStyle = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ flexDirection: "row", gap: 14, marginBottom: short ? 20 : 32 }} accessibilityLabel={`${value.length} chiffres saisis sur ${length}`}>
        {Array.from({ length }, (_, i) => (
          <View key={i} style={[p.dot, i < value.length && { backgroundColor: colors.brand, borderColor: colors.brand }]} />
        ))}
      </View>
      <View style={[p.grid, { width: size * 3 + gap * 2, gap }]}>
        {keys.map((k) => {
          if (k === "extra") {
            return extra ? (
              <Pressable key={k} accessibilityRole="button" accessibilityLabel={extra.label} onPress={extra.onPress} style={[p.key, keyStyle]}>
                <Icon name="face" color={colors.brand} size={28} />
              </Pressable>
            ) : (
              <View key={k} style={[p.key, keyStyle]} />
            );
          }
          if (k === "del") {
            return (
              <Pressable key={k} accessibilityRole="button" accessibilityLabel="Effacer" onPress={() => onChange(value.slice(0, -1))} style={[p.key, keyStyle]}>
                <Icon name="back" color={colors.ink} size={26} />
              </Pressable>
            );
          }
          return (
            <Pressable
              key={k}
              accessibilityRole="button"
              accessibilityLabel={k}
              onPress={() => value.length < length && onChange(value + k)}
              style={({ pressed }) => [p.key, keyStyle, p.digit, pressed && { backgroundColor: colors.brandSoft }]}
            >
              <Text style={p.digitText}>{k}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const p = StyleSheet.create({
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.silver },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  key: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center" },
  digit: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  digitText: { fontFamily: fonts.heading, fontSize: 26, color: colors.navy },
});
