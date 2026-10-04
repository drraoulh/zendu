import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/lib/theme";
import { Icon } from "./icons";

/** Pavé numérique pour le code PIN de l'appli. */
export function PinPad({ value, length = 6, onChange, extra }: { value: string; length?: number; onChange: (v: string) => void; extra?: { label: string; onPress: () => void } }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "extra", "0", "del"];
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ flexDirection: "row", gap: 14, marginBottom: 32 }} accessibilityLabel={`${value.length} chiffres saisis sur ${length}`}>
        {Array.from({ length }, (_, i) => (
          <View key={i} style={[p.dot, i < value.length && { backgroundColor: colors.brand, borderColor: colors.brand }]} />
        ))}
      </View>
      <View style={p.grid}>
        {keys.map((k) => {
          if (k === "extra") {
            return extra ? (
              <Pressable key={k} accessibilityRole="button" accessibilityLabel={extra.label} onPress={extra.onPress} style={p.key}>
                <Icon name="face" color={colors.brand} size={28} />
              </Pressable>
            ) : (
              <View key={k} style={p.key} />
            );
          }
          if (k === "del") {
            return (
              <Pressable key={k} accessibilityRole="button" accessibilityLabel="Effacer" onPress={() => onChange(value.slice(0, -1))} style={p.key}>
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
              style={({ pressed }) => [p.key, p.digit, pressed && { backgroundColor: colors.brandSoft }]}
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
  grid: { width: 276, flexDirection: "row", flexWrap: "wrap", gap: 18 },
  key: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center" },
  digit: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  digitText: { fontFamily: fonts.heading, fontSize: 26, color: colors.navy },
});
