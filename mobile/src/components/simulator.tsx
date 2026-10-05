import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { api, type CorridorMeta, type Quote } from "@/lib/api";
import { COUNTRIES, SAMPLE_AMOUNT, findCorridor, useCorridors, type CountryCode } from "@/lib/corridors";
import { countryName, etaLabel, money, parseAmount, rate } from "@/lib/format";
import { colors, fonts, radius } from "@/lib/theme";
import { Flag } from "./flag";
import { Icon } from "./icons";
import { Button } from "./ui";

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
        ? `Le montant doit être compris entre ${money(corridor.minSend, corridor.sendCurrency)} et ${money(corridor.maxSend, corridor.sendCurrency)}.`
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

  // Petits écrans (iPhone SE) : chiffres plus petits pour que « 80 770 » tienne à côté de la pastille.
  const compact = useWindowDimensions().width < 360;
  const amountSize = compact ? { fontSize: 24 } : null;
  const sendUnit = corridor.sendCurrency === "XAF" ? "FCFA" : corridor.sendCurrency;
  const receiveUnit = corridor.receiveCurrency === "XAF" ? "FCFA" : corridor.receiveCurrency;

  return (
    <View style={s.card}>
      <View style={s.row}>
        <View style={s.amountCol}>
          <Text style={s.fieldLabel}>Vous envoyez</Text>
          <TextInput
            value={text}
            onChangeText={(t) => setText(t.replace(/[^\d.,]/g, ""))}
            keyboardType="decimal-pad"
            inputMode="decimal"
            accessibilityLabel="Montant envoyé"
            style={[s.amountInput, amountSize]}
            maxLength={10}
          />
        </View>
        <CountryPill compact={compact} code={corridor.source} unit={sendUnit} label="Pays d'envoi" onPress={() => setPicker("source")} />
      </View>

      <View style={s.middle}>
        <Pressable accessibilityRole="button" accessibilityLabel="Inverser le trajet" onPress={swap} style={s.swap} hitSlop={6}>
          <Icon name="swap" color={colors.brand} size={18} />
        </Pressable>
        <View style={{ flex: 1, gap: 2 }}>
          {error ? (
            <Text style={s.error} accessibilityRole="alert">{error}</Text>
          ) : current ? (
            <>
              <Text style={s.rateText}>
                1 {current.sendCurrency} = {rate(current.rate)} {current.receiveCurrency}
              </Text>
              <Text style={s.hint}>
                Frais {money(current.fee, current.sendCurrency)} · {etaLabel(current.deliveryEstimate)}
              </Text>
            </>
          ) : (
            <Text style={s.hint}>Calcul du taux…</Text>
          )}
        </View>
      </View>

      <View style={[s.row, s.rowReceive]}>
        <View style={s.amountCol}>
          <Text style={s.fieldLabel}>Ils reçoivent</Text>
          {loading ? (
            <ActivityIndicator color={colors.brand} style={{ alignSelf: "flex-start", marginVertical: 10 }} />
          ) : (
            <Text style={[s.amountInput, amountSize, { color: colors.brand }]} numberOfLines={1} adjustsFontSizeToFit>
              {current ? money(current.receiveAmount, current.receiveCurrency).replace(/\s\S+$/, "") : "—"}
            </Text>
          )}
        </View>
        <CountryPill compact={compact} code={corridor.destination} unit={receiveUnit} label="Pays de réception" onPress={() => setPicker("destination")} />
      </View>

      {current ? (
        <View style={s.total}>
          <Text style={s.hint}>Total à payer</Text>
          <Text style={s.totalValue}>{money(current.total, current.sendCurrency)}</Text>
        </View>
      ) : null}

      {onContinue ? <Button title={ctaLabel} icon="send" onPress={onContinue} disabled={!current} style={{ marginTop: 14 }} /> : null}

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

/** Pastille pays + devise, comme sur les convertisseurs des applis de transfert. */
function CountryPill({ code, unit, label, onPress, compact = false }: { code: string; unit: string; label: string; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} : ${countryName(code)}, ${unit}. Modifier`}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [s.pill, compact && { paddingHorizontal: 8, gap: 4 }, pressed && { opacity: 0.8 }]}
    >
      <Flag code={code} size={compact ? 18 : 22} />
      <Text style={[s.pillText, compact && { fontSize: 13 }]}>{unit}</Text>
      <Icon name="chevDown" size={14} color={colors.muted} />
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
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: 14, borderWidth: 1, borderColor: colors.line, shadowColor: colors.navy, shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.bg, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10 },
  rowReceive: { backgroundColor: colors.brandSoft },
  amountCol: { flex: 1, minWidth: 0 },
  fieldLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  // minWidth 0 : sans lui, sur le web, le champ garde la largeur par défaut d'un <input> et pousse la pastille hors du cadre.
  amountInput: { minWidth: 0, fontFamily: fonts.display, fontSize: 30, color: colors.navy, paddingVertical: 4, ...(Platform.OS === "web" ? { outlineStyle: "none" as never } : null) },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 10, minHeight: 44, borderWidth: 1, borderColor: colors.line },
  pillText: { fontFamily: fonts.heading, fontSize: 15, color: colors.ink },
  middle: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 6 },
  swap: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  rateText: { fontFamily: fonts.heading, fontSize: 14, color: colors.ink },
  total: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 6, paddingTop: 12 },
  totalValue: { fontFamily: fonts.heading, fontSize: 16, color: colors.ink },
  countryName: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, flexShrink: 1 },
  error: { color: colors.danger, fontSize: 14 },
  hint: { color: colors.muted, fontSize: 13 },
  backdrop: { flex: 1, backgroundColor: "rgba(4,15,51,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 36, gap: 6 },
  sheetTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.ink, marginBottom: 8 },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 12, borderRadius: radius.md },
});
