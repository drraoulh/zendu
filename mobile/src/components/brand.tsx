import { Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { colors, fonts } from "@/lib/theme";

/** Symbole W en flèches (logo WorldSoft Transfer, piste B). */
export function WstSymbol({ size = 40, negative = false }: { size?: number; negative?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="WorldSoft Transfer">
      <Path d="M8 27.44L23.75 27.44L35.57 62.88L47.38 27.44L63.14 27.44L43.44 86.51L27.69 86.51Z" fill={negative ? colors.sky : "#3fa0ff"} />
      <Path
        d="M31.63 27.44L47.38 27.44L59.2 62.88L71.47 26.07L65.12 23.95L83.54 13.49L92 32.91L85.65 30.79L67.07 86.51L51.32 86.51Z"
        fill={negative ? colors.white : colors.brand}
      />
      <Path d="M55.26 51.07L47.38 27.44L39.51 51.07L47.38 74.7Z" fill={negative ? colors.silver : colors.brandStrong} />
    </Svg>
  );
}

/** Icône d'application arrondie (W blanc sur bleu électrique). */
export function WstAppIcon({ size = 96 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="WorldSoft Transfer">
      <Rect x="0" y="0" width="100" height="100" rx="22" fill={colors.brand} />
      <Path d="M18 33L30 33L39 60L48 33L60 33L45 78L33 78Z" fill={colors.silver} />
      <Path d="M36 33L48 33L57 60L66.4 32L61.6 30.4L75.6 22.4L82 37.2L77.2 35.6L63 78L51 78Z" fill={colors.white} />
      <Path d="M54 51L48 33L42 51L48 69Z" fill={colors.sky} />
    </Svg>
  );
}

/** Logo horizontal : symbole + « WorldSoft Transfer ». */
export function WstWordmark({ size = 30, negative = false }: { size?: number; negative?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }} accessible accessibilityLabel="WorldSoft Transfer">
      <WstSymbol size={size} negative={negative} />
      <Text style={{ fontFamily: fonts.display, fontSize: size * 0.6, color: negative ? colors.white : colors.navy, letterSpacing: -0.4 }}>
        WorldSoft{" "}
        <Text style={{ fontFamily: fonts.semibold, color: negative ? colors.sky : colors.brand }}>Transfer</Text>
      </Text>
    </View>
  );
}

/** « une solution PWFINTECH ». */
export function PoweredBy({ dark = false }: { dark?: boolean }) {
  return (
    <Text style={{ fontSize: 12, color: dark ? "rgba(255,255,255,0.7)" : colors.muted }}>
      une solution <Text style={{ fontFamily: fonts.heading, color: dark ? colors.white : colors.navy }}>PWFINTECH</Text>
    </Text>
  );
}
