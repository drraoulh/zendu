import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { api, type CorridorMeta, type Quote } from "@/lib/api";
import { COUNTRIES, SAMPLE_AMOUNT, findCorridor, useCorridors, type CountryCode } from "@/lib/corridors";
import { countryName, etaLabel, money, parseAmount, rateLine, unit } from "@/lib/format";
import { colors, fonts, radius } from "@/lib/theme";
import { Flag } from "./flag";
import { Icon } from "./icons";
import { Button } from "./ui";
import { tr } from "@/lib/i18n";

/**
 * Simulateur de transfert : choix du trajet, montant, devis en direct (API /api/quotes).
 * Les deux montants sont modifiables : « Vous envoyez » ou « Ils reçoivent » (le réflexe
 * « je veux qu'il reçoive 50 000 F »). Le dernier champ touché fait foi.
 */
export function Simulator({
  corridorId,
  amount,
  receiveAmount = null,
  onChange,
  onContinue,
  ctaLabel = tr("Continuer"),
}: {
  corridorId: string;
  amount: number;
  /** Montant reçu imposé par le client (null : c'est le montant envoyé qui fait foi). */
  receiveAmount?: number | null;
  onChange: (next: { corridorId: string; sendAmount: number; receiveAmount: number | null; quote: Quote | null }) => void;
  onContinue?: () => void;
  ctaLabel?: string;
}) {
  const corridors = useCorridors();
  const corridor = findCorridor(corridors, corridorId);
  const [mode, setMode] = useState<"send" | "receive">(receiveAmount ? "receive" : "send");
  const [text, setText] = useState(groupDigits(String(amount)));
  const [receiveText, setReceiveText] = useState(receiveAmount ? groupDigits(String(receiveAmount)) : "");
  const [quoted, setQuoted] = useState<{ key: string; quote: Quote } | null>(null);
  const [remoteError, setRemoteError] = useState<{ key: string; message: string } | null>(null);
  const [picker, setPicker] = useState<"source" | "destination" | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  // Horloge pour « taux mis à jour il y a … ».
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const value = parseAmount(mode === "send" ? text : receiveText);
  const key = `${corridor.id}:${mode}:${value}`;
  const localError =
    !Number.isFinite(value) || value <= 0
      ? tr("Saisissez un montant.")
      : mode === "send" && (value < corridor.minSend || value > corridor.maxSend)
        ? tr("Le montant doit être compris entre {0} et {1}.", money(corridor.minSend, corridor.sendCurrency), money(corridor.maxSend, corridor.sendCurrency))
        : null;
  // Le devis affiché doit correspondre exactement au trajet et au montant saisis.
  const current = !localError && quoted?.key === key ? quoted.quote : null;
  // Montant reçu demandé : le montant envoyé calculé doit rester dans les limites du trajet.
  const rangeError =
    current && mode === "receive" && (current.sendAmount < corridor.minSend || current.sendAmount > corridor.maxSend)
      ? tr("Le montant envoyé doit être compris entre {0} et {1}.", money(corridor.minSend, corridor.sendCurrency), money(corridor.maxSend, corridor.sendCurrency))
      : null;
  const error = localError ?? rangeError ?? (remoteError?.key === key ? remoteError.message : null);
  const loading = !error && !current;

  useEffect(() => {
    const receive = mode === "receive";
    if (localError) {
      onChangeRef.current({ corridorId: corridor.id, sendAmount: receive ? 0 : Number.isFinite(value) ? value : 0, receiveAmount: null, quote: null });
      return;
    }
    let alive = true;
    const k = `${corridor.id}:${mode}:${value}`;
    const timer = setTimeout(() => {
      api
        .quote(corridor.id, value, mode)
        .then((q) => {
          if (!alive) return;
          setQuoted({ key: k, quote: q });
          // L'autre champ suit le devis.
          if (receive) setText(groupDigits(String(q.sendAmount)));
          else setReceiveText(groupDigits(String(q.receiveAmount)));
          const inRange = !receive || (q.sendAmount >= corridor.minSend && q.sendAmount <= corridor.maxSend);
          onChangeRef.current({ corridorId: corridor.id, sendAmount: q.sendAmount, receiveAmount: receive ? value : null, quote: inRange ? q : null });
        })
        .catch((e: Error) => {
          if (!alive) return;
          setRemoteError({ key: k, message: e.message });
          onChangeRef.current({ corridorId: corridor.id, sendAmount: receive ? 0 : value, receiveAmount: null, quote: null });
        });
    }, 350);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [value, mode, corridor.id, corridor.minSend, corridor.maxSend, localError]);

  function resetTo(next: CorridorMeta, amount: number) {
    setMode("send");
    setText(groupDigits(String(amount)));
    setReceiveText("");
    onChange({ corridorId: next.id, sendAmount: amount, receiveAmount: null, quote: null });
  }

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
    const sendValue = parseAmount(text);
    resetTo(next, next.sendCurrency !== corridor.sendCurrency || !Number.isFinite(sendValue) ? (SAMPLE_AMOUNT[next.sendCurrency] ?? 100) : sendValue);
  }

  function swap() {
    const next = findCorridor(corridors, `${corridor.destination}-${corridor.source}`);
    resetTo(next, SAMPLE_AMOUNT[next.sendCurrency] ?? 100);
  }

  const rateAge = current?.fx?.fetchedAt ? Math.max(0, Math.round((now - new Date(current.fx.fetchedAt).getTime()) / 60_000)) : null;

  // Petits écrans (iPhone SE) : chiffres plus petits pour que « 80 770 » tienne à côté de la pastille.
  const compact = useWindowDimensions().width < 360;
  const amountSize = compact ? { fontSize: 24 } : null;
  const sendUnit = unit(corridor.sendCurrency);
  const receiveUnit = unit(corridor.receiveCurrency);

  return (
    <View style={s.card}>
      <View style={s.row}>
        <View style={s.amountCol}>
          <Text style={s.fieldLabel}>{tr("Vous envoyez")}</Text>
          <TextInput
            value={text}
            onChangeText={(t) => {
              setMode("send");
              setText(groupDigits(t));
            }}
            keyboardType="decimal-pad"
            inputMode="decimal"
            accessibilityLabel={tr("Montant envoyé")}
            style={[s.amountInput, amountSize]}
            maxLength={13}
          />
        </View>
        <CountryPill compact={compact} code={corridor.source} unit={sendUnit} label={tr("Pays d'envoi")} onPress={() => setPicker("source")} />
      </View>

      <View style={s.middle}>
        <Pressable accessibilityRole="button" accessibilityLabel={tr("Inverser le trajet")} onPress={swap} style={s.swap} hitSlop={6}>
          <Icon name="swap" color={colors.brand} size={18} />
        </Pressable>
        <View style={{ flex: 1, gap: 2 }}>
          {error ? (
            <Text style={s.error} accessibilityRole="alert">{error}</Text>
          ) : current ? (
            <>
              <Text style={s.rateText}>
                {rateLine(current.rate, current.sendCurrency, current.receiveCurrency)}
              </Text>
              <Text style={s.hint}>
                {current.fee > 0 ? tr("Frais {0}", money(current.fee, current.sendCurrency)) : tr("Sans frais")} · {etaLabel(current.deliveryEstimate)}
              </Text>
              {rateAge != null ? (
                <Text style={[s.hint, { fontSize: 12 }]}>
                  {tr("Taux mis à jour {0} · bloqué à la création du transfert", rateAge < 1 ? tr("à l'instant") : tr("il y a {0} min", rateAge))}
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={s.hint}>{tr("Calcul du taux…")}</Text>
          )}
        </View>
      </View>

      <View style={[s.row, s.rowReceive]}>
        <View style={s.amountCol}>
          <Text style={s.fieldLabel}>{tr("Ils reçoivent")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TextInput
              value={receiveText}
              onChangeText={(t) => {
                setMode("receive");
                setReceiveText(groupDigits(t));
              }}
              placeholder="—"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              inputMode="decimal"
              accessibilityLabel={tr("Montant reçu par le destinataire")}
              style={[s.amountInput, amountSize, { color: colors.brand, flex: 1 }]}
              maxLength={13}
            />
            {loading && mode === "send" ? <ActivityIndicator color={colors.brand} /> : null}
          </View>
        </View>
        <CountryPill compact={compact} code={corridor.destination} unit={receiveUnit} label={tr("Pays de réception")} onPress={() => setPicker("destination")} />
      </View>

      {current ? (
        <View style={s.total}>
          <Text style={s.hint}>{tr("Total à payer")}</Text>
          <Text style={s.totalValue}>{money(current.total, current.sendCurrency)}</Text>
        </View>
      ) : null}

      {onContinue ? <Button title={tr(ctaLabel)} icon="send" onPress={onContinue} disabled={!current} style={{ marginTop: 14 }} /> : null}

      <CountryPicker
        visible={picker != null}
        title={picker === "source" ? tr("Envoyer depuis") : tr("Envoyer vers")}
        selected={picker === "source" ? corridor.source : corridor.destination}
        onPick={pick}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

/** Saisie « 100000 » → « 100 000 » (milliers séparés comme sur les montants affichés). */
function groupDigits(raw: string) {
  const clean = raw.replace(/[^\d.,]/g, "");
  const m = /^(\d*)([.,]\d*)?$/.exec(clean);
  if (!m) return clean;
  return m[1].replace(/\B(?=(\d{3})+(?!\d))/g, " ") + (m[2] ?? "");
}

/** Pastille pays + devise, comme sur les convertisseurs des applis de transfert. */
function CountryPill({ code, unit, label, onPress, compact = false }: { code: string; unit: string; label: string; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tr("{0} : {1}, {2}. Modifier", tr(label), countryName(code), unit)}
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
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel={tr("Fermer")}>
        <Pressable style={s.sheet} onPress={() => undefined}>
          <Text style={s.sheetTitle}>{tr(title)}</Text>
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
                <Text style={s.hint}>{COUNTRIES[code].currency === "XAF" ? tr("Franc CFA (XAF)") : COUNTRIES[code].currency}</Text>
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
