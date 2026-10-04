import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Chips } from "@/components/form";
import { Button, Field, Header, Label, Notice, Screen, Small } from "@/components/ui";
import { api } from "@/lib/api";
import { frenchDate, hhmm } from "@/lib/dates";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";
import { colors, fonts, radius } from "@/lib/theme";

const TOPICS = ["Conseil & budget", "Épargne", "PME", "Éducation financière"] as const;
const MODES = [
  { value: "video", label: "Visio" },
  { value: "phone", label: "Téléphone" },
] as const;
const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Les 10 prochains jours ouvrables. */
function nextWorkdays() {
  const list: Date[] = [];
  const d = new Date();
  while (list.length < 10) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) list.push(new Date(d));
  }
  return list;
}

export default function Appointment() {
  const { profile } = useSession();
  const { addRequest } = useStore();
  const days = useMemo(() => nextWorkdays(), []);
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("Conseil & budget");
  const [mode, setMode] = useState<"video" | "phone">("video");
  const [date, setDate] = useState(iso(days[0]));
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .slots(date)
      .then((r) => {
        if (!alive) return;
        setSlots(r.slots);
        setSlotsError(null);
      })
      .catch((e: Error) => {
        if (!alive) return;
        setSlots([]);
        setSlotsError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [date]);

  async function confirm() {
    if (!profile || !time) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.submitRequest({
        kind: "finance_appointment",
        name: `${profile.firstName} ${profile.lastName}`,
        email: profile.email,
        phone: profile.phone,
        payload: { topic, mode, date, time, timezone: "America/Toronto", note: note.trim() || undefined },
      });
      addRequest({ reference: res.reference, kind: "finance_appointment", createdAt: new Date().toISOString(), summary: { topic, mode, date, time } });
      router.replace({ pathname: "/services/appointment-done", params: { reference: res.reference, topic, mode, date, time } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Réservation impossible");
      setTime(null);
      api.slots(date).then((r) => setSlots(r.slots)).catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen footer={<Button title="Confirmer le rendez-vous" onPress={confirm} disabled={!time} loading={busy} />}>
      <Header title="Prendre rendez-vous" />
      <Label>Sujet</Label>
      <Chips options={TOPICS.map((t) => ({ value: t, label: t }))} value={topic} onChange={setTopic} />
      <Label>Mode</Label>
      <Chips options={[...MODES]} value={mode} onChange={setMode} />
      <Label>Jour</Label>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {days.map((d) => {
          const v = iso(d);
          const on = v === date;
          return (
            <Pressable
              key={v}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={frenchDate(v)}
              onPress={() => {
                setDate(v);
                setTime(null);
                setSlots(null);
              }}
              style={[s.day, on && { backgroundColor: colors.brand, borderColor: colors.brand }]}
            >
              <Text style={[s.dayName, on && { color: colors.white }]}>{DAYS[d.getDay()]}</Text>
              <Text style={[s.dayNum, on && { color: colors.white }]}>{d.getDate()}</Text>
            </Pressable>
          );
        })}
      </View>
      <Small style={{ marginBottom: 8 }}>{frenchDate(date)} · heure de l&apos;Est (Toronto)</Small>
      {slots == null ? (
        <ActivityIndicator color={colors.brand} style={{ marginVertical: 16 }} />
      ) : slots.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {slots.map((t) => (
            <Pressable
              key={t}
              accessibilityRole="radio"
              accessibilityState={{ selected: t === time }}
              onPress={() => setTime(t)}
              style={[s.slot, t === time && { backgroundColor: colors.brand, borderColor: colors.brand }]}
            >
              <Text style={[s.slotText, t === time && { color: colors.white }]}>{hhmm(t)}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={{ marginBottom: 14 }}>
          <Notice tone="neutral" icon="clock" text={slotsError ?? "Aucun créneau libre ce jour-là. Choisissez un autre jour."} />
        </View>
      )}
      <Field
        label="Note pour le conseiller (facultatif)"
        value={note}
        onChangeText={setNote}
        placeholder="Ex. : je veux préparer un budget pour mes envois mensuels."
        multiline
        style={{ minHeight: 80, textAlignVertical: "top" }}
      />
      {error ? <Notice tone="danger" icon="alert" text={error} /> : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  day: { width: 58, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, alignItems: "center" },
  dayName: { fontSize: 12, color: colors.muted },
  dayNum: { fontFamily: fonts.heading, fontSize: 18, color: colors.ink },
  slot: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  slotText: { fontFamily: fonts.semibold, color: colors.ink },
});
