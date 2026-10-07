import { router } from "expo-router";
import { useState, type ReactNode, type Ref } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors, fonts, radius } from "@/lib/theme";
import { Icon, type IconName } from "./icons";

type Tone = "brand" | "success" | "warn" | "danger" | "neutral";

const TONE_COLORS: Record<Tone, { fg: string; bg: string }> = {
  brand: { fg: colors.brand, bg: colors.brandSoft },
  success: { fg: colors.success, bg: colors.successSoft },
  warn: { fg: colors.warn, bg: colors.warnSoft },
  danger: { fg: colors.danger, bg: colors.dangerSoft },
  neutral: { fg: colors.muted, bg: "#eef1f8" },
};

/* ---------- Mise en page ---------- */

export function Screen({
  children,
  scroll = true,
  edges = ["top", "bottom"],
  background = colors.bg,
  contentStyle,
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  background?: string;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
}) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { flex: 1 }, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {body}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Header({
  title,
  subtitle,
  back = true,
  right,
  onBack,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  onBack?: () => void;
}) {
  return (
    <View style={styles.header}>
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={10}
          onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/")))}
          style={styles.iconBtn}
        >
          <Icon name="back" color={colors.ink} />
        </Pressable>
      ) : (
        <View style={styles.headerSide} />
      )}
      <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 8 }}>
        {title ? <Text style={styles.headerTitle} numberOfLines={2}>{title}</Text> : null}
        {subtitle ? <Text style={styles.small} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.headerSide, { alignItems: "flex-end" }]}>{right}</View>
    </View>
  );
}

export function Steps({ current, total, label }: { current: number; total: number; label?: string }) {
  return (
    <View style={{ marginBottom: 18 }} accessibilityLabel={`Étape ${current} sur ${total}${label ? ` : ${label}` : ""}`}>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < current ? colors.brand : colors.line }} />
        ))}
      </View>
      {label ? (
        <Text style={[styles.small, { marginTop: 8, fontFamily: fonts.semibold, color: colors.brand }]}>
          Étape {current} sur {total} · {label}
        </Text>
      ) : null}
    </View>
  );
}

/* ---------- Typographie ---------- */

export function H1({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.h1, style]} accessibilityRole="header">{children}</Text>;
}
export function H2({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.h2, style]} accessibilityRole="header">{children}</Text>;
}
export function P({ children, style, muted = true }: { children: ReactNode; style?: StyleProp<TextStyle>; muted?: boolean }) {
  return <Text style={[styles.p, !muted && { color: colors.ink }, style]}>{children}</Text>;
}
export function Small({ children, style, numberOfLines }: { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  return <Text style={[styles.small, style]} numberOfLines={numberOfLines}>{children}</Text>;
}
export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

/* ---------- Actions ---------- */

export function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  loading = false,
  disabled = false,
  size = "lg",
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "light";
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: "lg" | "sm";
  style?: StyleProp<ViewStyle>;
}) {
  const v = {
    primary: { bg: colors.brand, fg: colors.white, border: colors.brand },
    secondary: { bg: colors.white, fg: colors.ink, border: colors.line },
    ghost: { bg: "transparent", fg: colors.brand, border: "transparent" },
    danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
    light: { bg: colors.white, fg: colors.navy, border: colors.white },
  }[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy: loading }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        size === "sm" && styles.btnSm,
        { backgroundColor: v.bg, borderColor: v.border, opacity: off ? 0.55 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} color={v.fg} size={size === "sm" ? 18 : 20} /> : null}
          <Text style={[styles.btnText, size === "sm" && { fontSize: 14 }, { color: v.fg }]} numberOfLines={2}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({ name, onPress, label, tone = "neutral" }: { name: IconName; onPress?: () => void; label: string; tone?: Tone }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8} style={[styles.iconBtn, { backgroundColor: TONE_COLORS[tone].bg }]}>
      <Icon name={name} color={TONE_COLORS[tone].fg} size={20} />
    </Pressable>
  );
}

/* ---------- Blocs ---------- */

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <View style={[styles.badge, { backgroundColor: TONE_COLORS[tone].bg }]}>
      <View style={[styles.dot, { backgroundColor: TONE_COLORS[tone].fg }]} />
      <Text style={[styles.badgeText, { color: TONE_COLORS[tone].fg }]}>{label}</Text>
    </View>
  );
}

export function Notice({ text, tone = "brand", icon = "info", title }: { text: string; tone?: Tone; icon?: IconName; title?: string }) {
  return (
    <View style={[styles.notice, { backgroundColor: TONE_COLORS[tone].bg }]} accessibilityRole="alert">
      <Icon name={icon} color={TONE_COLORS[tone].fg} size={20} />
      <View style={{ flex: 1 }}>
        {title ? <Text style={[styles.noticeTitle, { color: TONE_COLORS[tone].fg }]}>{title}</Text> : null}
        <Text style={[styles.small, { color: colors.ink }]}>{text}</Text>
      </View>
    </View>
  );
}

export function SummaryRow({
  label,
  value,
  strong = false,
  highlight = false,
  valueIcon,
}: {
  label: string;
  value: string;
  strong?: boolean;
  highlight?: boolean;
  /** Logo ou icône affiché devant la valeur (ex. logo MTN MoMo). */
  valueIcon?: ReactNode;
}) {
  const text = <Text style={[styles.rowValue, strong && { fontFamily: fonts.heading }, highlight && { color: colors.brand, fontFamily: fonts.heading }]}>{value}</Text>;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {valueIcon ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1, justifyContent: "flex-end" }}>
          {valueIcon}
          {text}
        </View>
      ) : (
        text
      )}
    </View>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 8 }} />;
}

export function ListItem({
  icon,
  title,
  subtitle,
  onPress,
  right,
  tone = "brand",
  leading,
  extra,
  subtitleLines = 2,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  tone?: Tone;
  leading?: ReactNode;
  /** Contenu affiché sous le sous-titre (badge, etc.). */
  extra?: ReactNode;
  subtitleLines?: number;
}) {
  const content = (
    <>
      {leading ??
        (icon ? (
          <View style={[styles.listIcon, { backgroundColor: TONE_COLORS[tone].bg }]}>
            <Icon name={icon} color={TONE_COLORS[tone].fg} size={20} />
          </View>
        ) : null)}
      <View style={{ flex: 1 }}>
        <Text style={styles.listTitle} numberOfLines={2}>{title}</Text>
        {subtitle ? <Text style={styles.small} numberOfLines={subtitleLines}>{subtitle}</Text> : null}
        {extra}
      </View>
      {right ?? (onPress ? <Icon name="chev" color={colors.muted} size={18} /> : null)}
    </>
  );
  // Sans action : simple ligne (un Pressable désactivé bloquerait aussi les boutons placés à droite).
  if (!onPress) return <View style={styles.listItem}>{content}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.listItem, pressed && { backgroundColor: colors.bg }]}>
      {content}
    </Pressable>
  );
}

/* ---------- Formulaires ---------- */

export function Field({
  label,
  error,
  hint,
  left,
  style,
  onFocus,
  onBlur,
  right,
  ref,
  ...props
}: TextInputProps & { label: string; error?: string | null; hint?: string; left?: ReactNode; right?: ReactNode; ref?: Ref<TextInput> }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <View style={[styles.input, focused && { borderColor: colors.brand }, error ? { borderColor: colors.danger } : null]}>
        {left}
        <TextInput
          ref={ref}
          placeholderTextColor="#8a94ad"
          accessibilityLabel={label}
          style={[styles.inputText, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {right}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Small style={{ marginTop: 4 }}>{hint}</Small> : null}
    </View>
  );
}

export function Choice({
  label,
  selected,
  onPress,
  icon,
  description,
  leading,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  description?: string;
  /** Élément affiché à gauche à la place de l'icône (ex. logo de l'opérateur). */
  leading?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, selected && { borderColor: colors.brand, backgroundColor: colors.brandSoft }]}
    >
      {leading ?? (icon ? <Icon name={icon} color={selected ? colors.brand : colors.muted} size={20} /> : null)}
      <View style={{ flex: 1 }}>
        <Text style={[styles.listTitle, { fontSize: 15 }]}>{label}</Text>
        {description ? <Small>{description}</Small> : null}
      </View>
      <View style={[styles.radio, selected && { borderColor: colors.brand }]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

export function Empty({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: ReactNode }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 36, paddingHorizontal: 12, gap: 8 }}>
      <View style={[styles.listIcon, { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.brandSoft }]}>
        <Icon name={icon} color={colors.brand} size={26} />
      </View>
      <Text style={[styles.h2, { fontSize: 18, textAlign: "center" }]}>{title}</Text>
      <P style={{ textAlign: "center" }}>{text}</P>
      {action ? <View style={{ marginTop: 8, alignSelf: "stretch" }}>{action}</View> : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  // Tablette (768 px) : colonne centrée de 640 px au lieu de champs et boutons étirés sur toute la largeur.
  content: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 8, width: "100%", maxWidth: 640, alignSelf: "center" },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, backgroundColor: "transparent", width: "100%", maxWidth: 640, alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingVertical: 8, marginBottom: 8 },
  headerSide: { minWidth: 44, flexShrink: 0 },
  headerTitle: { fontFamily: fonts.heading, fontSize: 17, lineHeight: 21, color: colors.ink, textAlign: "center" },
  iconBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  h1: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.navy, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.heading, fontSize: 20, lineHeight: 26, color: colors.ink },
  p: { fontSize: 15, lineHeight: 22, color: colors.muted },
  small: { fontSize: 13, lineHeight: 18, color: colors.muted },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink, marginBottom: 6 },
  btn: { minHeight: 54, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 18 },
  btnSm: { minHeight: 44, borderRadius: radius.sm, paddingHorizontal: 14 },
  btnText: { fontFamily: fonts.heading, fontSize: 16, textAlign: "center", flexShrink: 1 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: colors.line, shadowColor: colors.navy, shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, alignSelf: "flex-start" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: fonts.semibold, fontSize: 12 },
  notice: { flexDirection: "row", gap: 10, padding: 14, borderRadius: radius.md, alignItems: "flex-start" },
  noticeTitle: { fontFamily: fonts.heading, fontSize: 14, marginBottom: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 7, gap: 12 },
  // Libellé court (« Délai estimé ») sur une ligne : c'est la valeur qui passe à la ligne si besoin (320 px).
  rowLabel: { fontSize: 14, color: colors.muted, flexShrink: 0, maxWidth: "50%" },
  rowValue: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, textAlign: "right", flexShrink: 1 },
  listItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 4, borderRadius: radius.sm },
  listIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  listTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  input: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 52, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: 14 },
  // minWidth 0 : sinon, sur le web, la largeur par défaut d'un <input> déborde de la ligne.
  inputText: { flex: 1, minWidth: 0, fontSize: 16, color: colors.ink, paddingVertical: 12, ...(Platform.OS === "web" ? { outlineStyle: "none" as never } : null) },
  error: { color: colors.danger, fontSize: 13, marginTop: 4 },
  choice: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.white, marginBottom: 10 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand },
});
