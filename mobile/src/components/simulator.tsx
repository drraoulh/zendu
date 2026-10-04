import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { api, type CorridorMeta, type Quote } from "@/lib/api";
import { COUNTRIES, SAMPLE_AMOUNT, findCorridor, useCorridors, type CountryCode } from "@/lib/corridors";
import { countryName, etaLabel, money, parseAmount, rate } from "@/lib/format";
import { colors, fonts, radius } from "@/lib/theme";
import { Flag } from "./flag";
import { Icon } from "./icons";
import { Button, Divider, SummaryRow } from "./ui";

/**
 * Simulateur de transfert : choix du trajet, montant, devis en direct (API /api/quotes).
 */
export function Simulator({
  corridorId,
  amount,
  onChange,
  onContinue,
  ctaLabel = "Continuer",
}: {
  corridorId: string;
  amount: number;
  onChange: (next: { corridorId: string; sendAmount: number; quote: Quote | null }) => void;
  onContinue?: () => void;
  ctaLabel?: string;
}) {
  const corridors = useCorridors();
  const corridor = findCorridor(corridors, corridorId);
  const [text, setText] = useState(String(amount));
  const [quoted, setQuoted] = useState<{ key: string; quote: Quote } | null>(null);
  const [remoteError, setRemoteError] = useState<{ key: string; message: string } | null>(null);
  const [picker, setPicker] = useState<"source" | "destination" | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const value = parseAmount(text);
  const key = `${corridor.id}:${value}`;
  const localError =
    !Number.isFinite(value) || value <= 0
      ? "Saisissez un montant."
      : value < corridor.minSend || value > corridor.maxSend
        ? `Entre ${money(corridor.minSend, corridor.sendCurrency)} et ${money(corridor.maxSend, corridor.sendCurrency)}.`
        : null;
  // Le devis affiché doit correspondre exactement au trajet et au montant saisis.
  const current = !localError && quoted?.key === key ? quoted.quote : null;
  const error = localError ?? (remoteError?.key === key ? remoteError.message : null);
  const loading = !error && !current;

  useEffect(() => {
    if (localError) {
      onChangeRef.current({ corridorId: corridor.id, sendAmount: Number.isFinite(value) ? value : 0, quote: null });
      return;
    }
    let alive = true;
    const timer = setTimeout(() => {
      api
        .quote(corridor.id, value)
        .then((q) => {
          if (!alive) return;
          setQuoted({ key: `${corridor.id}:${value}`, quote: q });
          onChangeRef.current({ corridorId: corridor.id, sendAmount: value, quote: q });
        })
        .catch((e: Error) => {
          if (!alive) return;
          setRemoteError({ key: `${corridor.id}:${value}`, message: e.message });
          onChangeRef.current({ corridorId: corridor.id, sendAmount: value, quote: null });
        });
    }, 350);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [value, corridor.id, localError]);

  function pick(code: CountryCode) {
    const side = picker;
    setPicker(null);
    if (!side) return;
    let source = corridor.source;
    let destination = corridor.destination;
    if (side === "source") {
      source = code;
      if (destination === code) destination = corridor.source;
    } else {
      destination = code;
      if (source === code) source = corridor.destination;
    }
    const next = findCorridor(corridors, `${source}-${destination}`);
    const amount = next.sendCurrency !== corridor.sendCurrency ? (SAMPLE_AMOUNT[next.sendCurrency] ?? 100) : value;
    setText(String(amount));
    onChange({ corridorId: next.id, sendAmount: amount, quote: null });
  }

  function swap() {
    const next = findCorridor(corridors, `${corridor.destination}-${corridor.source}`);
    const amount = SAMPLE_AMOUNT[next.sendCurrency] ?? 100;
    setText(String(amount));
    onChange({ corridorId: next.id, sendAmount: amount, quote: null });
  }

  return (
    <View style={s.card}>
      <View style={s.route}>
        <CountryButton label="De" code={corridor.source} onPress={() => setPicker("source")} />
        <Pressable accessibilityRole="button" accessibilityLabel="Inverser le trajet" onPress={swap} style={s.swap} hitSlop={6}>
          <Icon name="swap" color={colors.brand} size={18} />
        </Pressable>
        <CountryButton label="Vers" code={corridor.destination} onPress={() => setPicker("destination")} />
      </View>

      <Text style={s.fieldLabel}>Vous envoyez</Text>
      <View style={s.amountBox}>
        <TextInput
          value={text}
          onChangeText={(t) => setText(t.replace(/[^\d.,]/g, ""))}
          keyboardType="decimal-pad"
          inputMode="decimal"
          accessibilityLabel="Montant envoyé"
          style={s.amountInput}
          maxLength={10}
        />
        <Text style={s.currency}>{corridor.sendCurrency === "XAF" ? "FCFA" : corridor.sendCurrency}</Text>
      </View>

      <Text style={[s.fieldLabel, { marginTop: 14 }]}>Le bénéficiaire reçoit</Text>
      <View style={[s.amountBox, { backgroundColor: colors.brandSoft, borderColor: colors.brandSoft }]}>
        {loading ? (
          <ActivityIndicator color={colors.brand} />
        ) : (
          <Text style={[s.amountInput, { color: colors.brand }]} numberOfLines={1} adjustsFontSizeToFit>
            {current ? money(current.receiveAmount, current.receiveCurrency).replace(/\s\S+$/, "") : "—"}
          </Text>
        )}
        <Text style={[s.currency, { color: colors.brand }]}>{corridor.receiveCurrency === "XAF" ? "FCFA" : corridor.receiveCurrency}</Text>
      </View>

      <View style={{ marginTop: 12 }}>
        {error ? (
          <Text style={s.error} accessibilityRole="alert">{error}</Text>
        ) : current ? (
          <>
            <SummaryRow label="Taux appliqué" value={`1 ${current.sendCurrency} = ${rate(current.rate)} ${current.receiveCurrency}`} />
            <SummaryRow label="Frais" value={money(current.fee, current.sendCurrency)} />
            <Divider />
            <SummaryRow label="Total à payer" value={money(current.total, current.sendCurrency)} strong />
            <SummaryRow label="Délai estimé" value={etaLabel(current.deliveryEstimate)} />
          </>
        ) : (
          <Text style={s.hint}>Calcul du devis…</Text>
        )}
      </View>

      {onContinue ? <Button title={ctaLabel} icon="send" onPress={onContinue} disabled={!current} style={{ marginTop: 16 }} /> : null}

      <CountryPicker
        visible={picker != null}
        title={picker === "source" ? "Envoyer depuis" : "Envoyer vers"}
        selected={picker === "source" ? corridor.source : corridor.destination}
        onPick={pick}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

function CountryButton({ label, code, onPress }: { label: string; code: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} ${countryName(code)}, modifier`} onPress={onPress} style={s.country}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={s.countryLabel}>{label}</Text>
        <Icon name="chevDown" size={14} color={colors.muted} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Flag code={code} size={20} />
        <Text style={s.countryName} numberOfLines={1}>{countryName(code)}</Text>
      </View>
    </Pressable>
  );
}

function CountryPicker({
  visible,
  title,
  selected,
  onPick,
  onClose,
}: {
  visible: boolean;
  title: string;
  selected: string;
  onPick: (code: CountryCode) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Fermer">
        <Pressable style={s.sheet} onPress={() => undefined}>
          <Text style={s.sheetTitle}>{title}</Text>
          {(Object.keys(COUNTRIES) as CountryCode[]).map((code) => (
            <Pressable
              key={code}
              accessibilityRole="radio"
              accessibilityState={{ selected: code === selected }}
              onPress={() => onPick(code)}
              style={[s.sheetRow, code === selected && { backgroundColor: colors.brandSoft }]}
            >
              <Flag code={code} size={30} />
              <View style={{ flex: 1 }}>
                <Text style={s.countryName}>{COUNTRIES[code].name}</Text>
                <Text style={s.hint}>{COUNTRIES[code].currency === "XAF" ? "Franc CFA (XAF)" : COUNTRIES[code].currency}</Text>
              </View>
              {code === selected ? <Icon name="check" color={colors.brand} /> : null}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export type { CorridorMeta };

const s = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: 18, borderWidth: 1, borderColor: colors.line, shadowColor: colors.navy, shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  route: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  country: { flex: 1, backgroundColor: colors.bg, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 9, gap: 4 },
  countryLabel: { fontSize: 11, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6 },
  countryName: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, flexShrink: 1 },
  swap: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  fieldLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted, marginBottom: 6 },
  amountBox: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 14, minHeight: 60 },
  amountInput: { flex: 1, fontFamily: fonts.display, fontSize: 26, color: colors.navy, paddingVertical: 10 },
  currency: { fontFamily: fonts.heading, fontSize: 16, color: colors.navy },
  error: { color: colors.danger, fontSize: 14 },
  hint: { color: colors.muted, fontSize: 13 },
  backdrop: { flex: 1, backgroundColor: "rgba(4,15,51,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 36, gap: 6 },
  sheetTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.ink, marginBottom: 8 },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 12, borderRadius: radius.md },
});
