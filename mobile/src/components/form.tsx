import { useRef, useState, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { PASSWORD_RULES } from "@/lib/session";
import { colors, fonts, radius } from "@/lib/theme";
import { Icon, type IconName } from "./icons";
import { Button, Label, Small } from "./ui";

/* ---------- Liste déroulante (feuille modale) ---------- */

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Choisir…",
  error,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} : ${current?.label ?? placeholder}`}
        onPress={() => setOpen(true)}
        style={[f.select, error ? { borderColor: colors.danger } : null]}
      >
        <Text style={[f.selectText, !current && { color: "#8a94ad" }]} numberOfLines={1}>{current?.label ?? placeholder}</Text>
        <Icon name="chevDown" size={18} color={colors.muted} />
      </Pressable>
      {error ? <Text style={f.error}>{error}</Text> : null}
      <Sheet visible={open} title={label} onClose={() => setOpen(false)}>
        {options.map((o) => (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: o.value === value }}
            onPress={() => {
              onChange(o.value);
              setOpen(false);
            }}
            style={[f.option, o.value === value && { backgroundColor: colors.brandSoft }]}
          >
            <Text style={f.optionText}>{o.label}</Text>
            {o.value === value ? <Icon name="check" color={colors.brand} size={18} /> : null}
          </Pressable>
        ))}
      </Sheet>
    </View>
  );
}

export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={f.backdrop} onPress={onClose} accessibilityLabel="Fermer">
        <Pressable style={f.sheet} onPress={() => undefined}>
          <View style={f.grabber} />
          <Text style={f.sheetTitle}>{title}</Text>
          <ScrollView style={{ maxHeight: 420 }}>{children}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ---------- Boîte de confirmation (fonctionne aussi sur le web) ---------- */

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[f.backdrop, { justifyContent: "center", padding: 24 }]}>
        <View style={f.dialog} accessibilityRole="alert">
          <Text style={f.sheetTitle}>{title}</Text>
          <Small style={{ marginBottom: 18 }}>{message}</Small>
          <View style={{ gap: 8 }}>
            <Button title={confirmLabel} variant={destructive ? "danger" : "primary"} onPress={onConfirm} />
            <Button title="Annuler" variant="secondary" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ---------- Puces de choix ---------- */

export function Chips<T extends string>({
  options,
  value,
  onChange,
  multiple = false,
}: {
  options: { value: T; label: string; icon?: IconName }[];
  value: T | T[];
  onChange: (v: T) => void;
  multiple?: boolean;
}) {
  const selected = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
      {options.map((o) => {
        const on = selected(o.value);
        return (
          <Pressable
            key={o.value}
            accessibilityRole={multiple ? "checkbox" : "radio"}
            accessibilityState={multiple ? { checked: on } : { selected: on }}
            onPress={() => onChange(o.value)}
            style={[f.chip, on && { backgroundColor: colors.brand, borderColor: colors.brand }]}
          >
            {o.icon ? <Icon name={o.icon} size={16} color={on ? colors.white : colors.muted} /> : null}
            <Text style={[f.chipText, on && { color: colors.white }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- Interrupteur ---------- */

export function ToggleRow({
  icon,
  label,
  sub,
  value,
  onChange,
  disabled = false,
}: {
  icon?: IconName;
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={f.toggle}>
      {icon ? (
        <View style={f.toggleIcon}>
          <Icon name={icon} color={colors.brand} size={20} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={f.toggleLabel}>{label}</Text>
        {sub ? <Small>{sub}</Small> : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: colors.brand, false: colors.line }}
        thumbColor={colors.white}
      />
    </View>
  );
}

/* ---------- Code à N chiffres ---------- */

export function OtpInput({ length = 6, value, onChange, label = "Code de vérification" }: { length?: number; value: string; onChange: (v: string) => void; label?: string }) {
  const ref = useRef<TextInput>(null);
  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel={label} style={{ marginVertical: 12 }}>
      <View style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
        {Array.from({ length }, (_, i) => {
          const ch = value[i] ?? "";
          const active = i === Math.min(value.length, length - 1);
          return (
            <View key={i} style={[f.otpBox, active && { borderColor: colors.brand }, ch ? { backgroundColor: colors.brandSoft, borderColor: colors.brandSoft } : null]}>
              <Text style={f.otpText}>{ch}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, length))}
        keyboardType="number-pad"
        inputMode="numeric"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={length}
        autoFocus
        accessibilityLabel={label}
        style={f.otpHidden}
      />
    </Pressable>
  );
}

/* ---------- Règles du mot de passe ---------- */

export function PasswordChecklist({ value }: { value: string }) {
  const score = PASSWORD_RULES.filter((r) => r.test(value)).length;
  const strength = ["Très faible", "Faible", "Moyenne", "Bonne", "Élevée"][score];
  const color = score >= 4 ? colors.success : score >= 3 ? colors.brand : score >= 2 ? colors.warn : colors.danger;
  return (
    <View style={{ marginBottom: 14 }}>
      {value ? (
        <View style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: "row", gap: 4, marginBottom: 6 }}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < score ? color : colors.line }} />
            ))}
          </View>
          <Small style={{ color }}>Force : {strength.toLowerCase()}</Small>
        </View>
      ) : null}
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value);
        return (
          <View key={r.label} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 3 }}>
            <Icon name={ok ? "check" : "close"} size={16} color={ok ? colors.success : colors.silver} strokeWidth={2.4} />
            <Small style={{ color: ok ? colors.ink : colors.muted }}>{r.label}</Small>
          </View>
        );
      })}
    </View>
  );
}

/* ---------- Divers ---------- */

export function Avatar({ name, size = 44, tone = "brand" }: { name: string; size?: number; tone?: "brand" | "soft" }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2.6,
        backgroundColor: tone === "brand" ? colors.brand : colors.brandSoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontFamily: fonts.display, fontSize: size * 0.36, color: tone === "brand" ? colors.white : colors.brand }}>{initials || "?"}</Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={f.section}>{children.toUpperCase()}</Text>;
}

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 12 }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: checked ? colors.brand : colors.line,
          backgroundColor: checked ? colors.brand : colors.white,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked ? <Icon name="check" color={colors.white} size={14} strokeWidth={3} /> : null}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );
}

export function NumberedSteps({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <View style={{ gap: 14 }}>
      {steps.map((s, i) => (
        <View key={s.title} style={{ flexDirection: "row", gap: 12 }}>
          <View style={f.num}>
            <Text style={{ color: colors.brand, fontFamily: fonts.heading }}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={f.toggleLabel}>{s.title}</Text>
            <Small>{s.text}</Small>
          </View>
        </View>
      ))}
    </View>
  );
}

const f = StyleSheet.create({
  select: { flexDirection: "row", alignItems: "center", minHeight: 52, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: 14, gap: 8 },
  selectText: { flex: 1, fontSize: 16, color: colors.ink },
  error: { color: colors.danger, fontSize: 13, marginTop: 4 },
  backdrop: { flex: 1, backgroundColor: "rgba(4,15,51,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 34 },
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 12 },
  sheetTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.ink, marginBottom: 10 },
  option: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: radius.sm },
  optionText: { fontSize: 16, color: colors.ink },
  dialog: { backgroundColor: colors.white, borderRadius: radius.xl, padding: 22 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  chipText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  toggle: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  toggleIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  toggleLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  otpBox: { width: 46, height: 56, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  otpText: { fontFamily: fonts.display, fontSize: 24, color: colors.navy },
  otpHidden: { position: "absolute", opacity: 0, width: 1, height: 1 },
  section: { fontFamily: fonts.heading, fontSize: 12, letterSpacing: 0.8, color: colors.muted, marginTop: 18, marginBottom: 8 },
  num: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
});
