"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { localeTag } from "@/components/app/country-name";
import { Icon, type IconName } from "@/components/ui/icon";
import { company, companyLocality } from "@/lib/company";
import { useT } from "@/i18n/define";
import { financeJourney, wizardMessages } from "@/i18n/journeys";
import {
  APPOINTMENT_TZ,
  browserTimeZone,
  fallbackSlots,
  formatDay,
  localEquivalent,
  upcomingBusinessDays,
} from "./dates";
import { RadioCards, TextArea, TextInput } from "./fields";
import { JourneyAside, JourneyShell } from "./shell";
import { EMAIL_RE, PHONE_RE } from "./submit";
import { type FieldErrors, Wizard, type WizardStep } from "./wizard";

const TOPICS = ["budget", "savings", "business", "education", "other"] as const;
const TOPIC_ICONS: Record<(typeof TOPICS)[number], IconName> = {
  budget: "chart",
  savings: "wallet",
  business: "finance",
  education: "sparkle",
  other: "info",
};
type Topic = (typeof TOPICS)[number];
type Mode = "video" | "phone" | "in_person";

type Values = {
  topic: string;
  topicDetail: string;
  mode: string;
  date: string;
  time: string;
  /** Créneau choisi hors API (indisponible) : à confirmer par l'équipe. */
  manualSlot: boolean;
  availability: string;
  name: string;
  email: string;
  phone: string;
  note: string;
};

const INITIAL: Values = {
  topic: "",
  topicDetail: "",
  mode: "",
  date: "",
  time: "",
  manualSlot: false,
  availability: "",
  name: "",
  email: "",
  phone: "",
  note: "",
};

/** Adresse de rendez-vous en personne : uniquement si l'entreprise l'a configurée. */
const inPersonAddress = company.address
  ? [company.address, companyLocality()].filter(Boolean).join(", ")
  : null;

type SlotState =
  | { status: "idle" | "loading" | "error"; slots: string[] }
  | { status: "ok"; slots: string[] };

/* -------------------------------------------------------------------------- */
/* Sélecteur de date + créneau                                                 */
/* -------------------------------------------------------------------------- */

function DateSlotPicker({
  values,
  set,
  errors,
  fieldId,
}: {
  values: Values;
  set: <K extends keyof Values>(key: K, value: Values[K]) => void;
  errors: FieldErrors;
  fieldId: (name: string) => string;
}) {
  const t = useT(financeJourney);
  const { locale } = useI18n();
  const tag = localeTag(locale);
  const days = useMemo(() => upcomingBusinessDays(3), []);
  const [userTz, setUserTz] = useState<string>(APPOINTMENT_TZ);
  const [state, setState] = useState<SlotState>({ status: "idle", slots: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => setUserTz(browserTimeZone()), []);

  // Chargement des créneaux de la date choisie.
  const { date } = values;
  useEffect(() => {
    if (!date) return;
    const ctrl = new AbortController();
    setState({ status: "loading", slots: [] });
    fetch(`/api/appointments/slots?date=${encodeURIComponent(date)}`, { signal: ctrl.signal, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as { slots?: unknown };
        const slots = Array.isArray(json.slots) ? json.slots.filter((s): s is string => typeof s === "string") : [];
        setState({ status: "ok", slots });
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name === "AbortError") return;
        setState({ status: "error", slots: [] });
      });
    return () => ctrl.abort();
  }, [date, attempt]);

  // Cohérence du créneau mémorisé avec la réponse de l'API.
  useEffect(() => {
    if (state.status === "ok") {
      if (values.manualSlot) set("manualSlot", false);
      if (values.time && !state.slots.includes(values.time)) set("time", "");
    } else if (state.status === "error" && !values.manualSlot) {
      set("manualSlot", true);
    }
  }, [state, values.manualSlot, values.time, set]);

  // Regroupement par semaine (lundi → vendredi) pour l'affichage en calendrier.
  const weeks = useMemo(() => {
    const out: string[][] = [];
    let current: string[] = [];
    let lastWd = -1;
    for (const d of days) {
      const wd = new Date(`${d}T00:00:00Z`).getUTCDay();
      if (wd <= lastWd && current.length) {
        out.push(current);
        current = [];
      }
      current.push(d);
      lastWd = wd;
    }
    if (current.length) out.push(current);
    return out;
  }, [days]);

  const dateError = errors.date;
  const timeError = errors.time;
  const slotList = state.status === "error" ? fallbackSlots() : state.slots;
  // 1er janvier 2024 = lundi : en-têtes lun → ven dans la langue courante.
  const weekdayHeaders = [1, 2, 3, 4, 5].map((n) => formatDay(`2024-01-0${n}`, tag, { weekday: "short" }));

  return (
    <div className="grid gap-6">
      <fieldset aria-describedby={dateError ? `${fieldId("date")}-error` : `${fieldId("date")}-hint`} className="min-w-0">
        <legend className="mb-1.5 text-sm font-semibold text-ink">
          {t("dateLabel")}
          <span className="ml-0.5 text-brand" aria-hidden>
            *
          </span>
        </legend>
        <p id={`${fieldId("date")}-hint`} className="mb-3 text-xs text-muted">
          {t("dateHint")}
        </p>
        <div className="rounded-2xl border border-line p-3 sm:p-4">
          <div className="grid grid-cols-5 gap-1.5 pb-2 text-center text-[0.68rem] font-bold uppercase tracking-wide text-muted sm:gap-2">
            {weekdayHeaders.map((w) => (
              <span key={w} aria-hidden>
                {w}
              </span>
            ))}
          </div>
          <div className="grid gap-1.5 sm:gap-2">
            {weeks.map((week, wi) => {
              const firstWd = new Date(`${week[0]}T00:00:00Z`).getUTCDay();
              return (
                <div key={week[0]} className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {Array.from({ length: firstWd - 1 }, (_, i) => (
                    <span key={`pad-${wi}-${i}`} aria-hidden />
                  ))}
                  {week.map((d, di) => {
                    const selected = values.date === d;
                    const isFirst = wi === 0 && di === 0;
                    return (
                      <button
                        key={d}
                        id={isFirst ? fieldId("date") : undefined}
                        type="button"
                        aria-pressed={selected}
                        aria-label={formatDay(d, tag, { weekday: "long", day: "numeric", month: "long" })}
                        onClick={() => {
                          set("date", d);
                          set("time", "");
                        }}
                        className={`flex min-h-14 flex-col items-center justify-center rounded-xl border px-1 py-2 text-center transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 ${
                          selected
                            ? "bg-brand-gradient border-transparent text-white shadow-[0_8px_18px_-8px_rgba(11,77,255,0.8)]"
                            : dateError
                              ? "border-danger/40 bg-white text-ink hover:border-brand/50"
                              : "border-line bg-white text-ink hover:border-brand/50 hover:bg-brand-soft/50"
                        }`}
                      >
                        <span className="font-display text-base font-extrabold leading-none">
                          {formatDay(d, tag, { day: "numeric" })}
                        </span>
                        <span className={`mt-1 text-[0.65rem] font-semibold uppercase ${selected ? "text-white/80" : "text-muted"}`}>
                          {formatDay(d, tag, { month: "short" })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        {dateError && (
          <p id={`${fieldId("date")}-error`} className="mt-1.5 text-xs font-medium text-danger">
            {dateError}
          </p>
        )}
      </fieldset>

      {values.date && (
        <fieldset className="min-w-0" aria-describedby={timeError ? `${fieldId("time")}-error` : undefined}>
          <legend className="mb-1.5 text-sm font-semibold text-ink">
            {t("timeLabel", { date: formatDay(values.date, tag, { weekday: "long", day: "numeric", month: "long" }) })}
            <span className="ml-0.5 text-brand" aria-hidden>
              *
            </span>
          </legend>
          <p className="mb-3 text-xs text-muted">{t("timeHint")}</p>

          <div aria-live="polite">
            {state.status === "loading" && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label={t("slotsLoading")}>
                <span className="sr-only">{t("slotsLoading")}</span>
                {Array.from({ length: 8 }, (_, i) => (
                  <span key={i} aria-hidden className="h-11 animate-pulse rounded-xl bg-surface-soft" />
                ))}
              </div>
            )}

            {state.status === "ok" && state.slots.length === 0 && (
              <p className="rounded-2xl bg-surface-soft px-4 py-3 text-sm text-muted">{t("slotsEmpty")}</p>
            )}

            {state.status === "error" && (
              <div className="mb-4 flex flex-col gap-2 rounded-2xl bg-warn/10 px-4 py-3 text-sm text-ink sm:flex-row sm:items-start sm:justify-between">
                <span className="inline-flex items-start gap-2">
                  <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
                  {t("slotsError")}
                </span>
                <button
                  type="button"
                  onClick={() => setAttempt((a) => a + 1)}
                  className="self-start rounded-full px-3 py-1 text-xs font-semibold text-brand hover:bg-white"
                >
                  {t("slotsRetry")}
                </button>
              </div>
            )}
          </div>

          {(state.status === "ok" || state.status === "error") && slotList.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slotList.map((s, i) => {
                const selected = values.time === s;
                const local = localEquivalent(values.date, s, userTz, tag);
                return (
                  <button
                    key={s}
                    id={i === 0 ? fieldId("time") : undefined}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => set("time", s)}
                    className={`flex min-h-11 flex-col items-center justify-center rounded-xl border px-2 py-2 text-sm font-semibold tabular-nums transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 ${
                      selected
                        ? "border-brand bg-brand text-white"
                        : timeError
                          ? "border-danger/40 bg-white text-ink hover:border-brand/50"
                          : "border-line bg-white text-ink hover:border-brand/50 hover:bg-brand-soft/50"
                    }`}
                  >
                    {s}
                    {local && (
                      <span className={`mt-0.5 text-[0.65rem] font-medium ${selected ? "text-white/80" : "text-muted"}`}>
                        {t("yourTime", { time: local })}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {timeError && (
            <p id={`${fieldId("time")}-error`} className="mt-1.5 text-xs font-medium text-danger">
              {timeError}
            </p>
          )}

          {state.status === "error" && (
            <TextArea
              className="mt-5"
              id={fieldId("availability")}
              label={t("availabilityLabel")}
              hint={t("availabilityHint")}
              rows={3}
              maxLength={500}
              value={values.availability}
              onChange={(v) => set("availability", v)}
            />
          )}
        </fieldset>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Parcours                                                                    */
/* -------------------------------------------------------------------------- */

export function FinanceAppointmentJourney() {
  const t = useT(financeJourney);
  const w = useT(wizardMessages);
  const { locale } = useI18n();
  const tag = localeTag(locale);

  const topicLabel = (v: string) => (TOPICS.includes(v as Topic) ? t(`topic_${v as Topic}`) : v);
  const modeLabel = (v: string) =>
    v === "video" ? t("modeVideo") : v === "phone" ? t("modePhone") : v === "in_person" ? t("modeInPerson") : v;

  const modes: { value: Mode; label: string; description: string; icon: IconName }[] = [
    { value: "video", label: t("modeVideo"), description: t("modeVideoText"), icon: "tech" },
    { value: "phone", label: t("modePhone"), description: t("modePhoneText"), icon: "phone" },
    ...(inPersonAddress
      ? [{ value: "in_person" as const, label: t("modeInPerson"), description: inPersonAddress, icon: "pin" as const }]
      : []),
  ];

  const steps: WizardStep<Values>[] = [
    {
      key: "topic",
      label: t("stepTopic"),
      title: t("topicTitle"),
      description: t("topicText"),
      fields: ["topic", "topicDetail"],
      validate: (v) => ({
        topic: v.topic ? undefined : t("errTopic"),
        topicDetail: v.topic === "other" && !v.topicDetail.trim() ? w("errRequired") : undefined,
      }),
      render: ({ values, set, errors, fieldId }) => (
        <>
          <RadioCards
            id={fieldId("topic")}
            label={t("topicLabel")}
            required
            error={errors.topic}
            value={values.topic}
            onChange={(v) => set("topic", v)}
            options={TOPICS.map((k) => ({
              value: k,
              label: t(`topic_${k}`),
              description: t(`topic_${k}_text`),
              icon: TOPIC_ICONS[k],
            }))}
          />
          {values.topic === "other" && (
            <TextInput
              id={fieldId("topicDetail")}
              label={t("topicDetailLabel")}
              required
              maxLength={160}
              error={errors.topicDetail}
              value={values.topicDetail}
              onChange={(v) => set("topicDetail", v)}
            />
          )}
        </>
      ),
    },
    {
      key: "mode",
      label: t("stepMode"),
      title: t("modeTitle"),
      description: t("modeText"),
      fields: ["mode"],
      validate: (v) => ({
        mode: modes.some((m) => m.value === v.mode) ? undefined : t("errMode"),
      }),
      render: ({ values, set, errors, fieldId }) => (
        <RadioCards
          id={fieldId("mode")}
          label={t("modeLabel")}
          required
          columns={1}
          error={errors.mode}
          value={values.mode}
          onChange={(v) => set("mode", v)}
          options={modes}
        />
      ),
    },
    {
      key: "date",
      label: t("stepDate"),
      title: t("dateTitle"),
      description: t("dateText"),
      fields: ["date", "time", "availability"],
      validate: (v) => ({
        date: v.date ? undefined : t("errDate"),
        time: v.date && !v.time ? t("errTime") : undefined,
      }),
      render: (ctx) => <DateSlotPicker {...ctx} />,
    },
    {
      key: "contact",
      label: t("stepContact"),
      title: t("contactTitle"),
      description: t("contactText"),
      fields: ["name", "email", "phone", "note"],
      validate: (v) => ({
        name: v.name.trim().length >= 2 ? undefined : w("errName"),
        email: !v.email.trim() ? w("errRequired") : EMAIL_RE.test(v.email.trim()) ? undefined : w("errEmail"),
        phone:
          v.mode === "phone" && !v.phone.trim()
            ? t("errPhoneRequired")
            : v.phone.trim() && !PHONE_RE.test(v.phone.trim())
              ? w("errPhone")
              : undefined,
      }),
      render: ({ values, set, errors, fieldId }) => (
        <>
          <TextInput
            id={fieldId("name")}
            label={w("fName")}
            required
            autoComplete="name"
            maxLength={120}
            error={errors.name}
            value={values.name}
            onChange={(v) => set("name", v)}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput
              id={fieldId("email")}
              label={w("fEmail")}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              error={errors.email}
              value={values.email}
              onChange={(v) => set("email", v)}
            />
            <TextInput
              id={fieldId("phone")}
              label={w("fPhone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required={values.mode === "phone"}
              hint={values.mode === "phone" ? t("phoneHint") : undefined}
              error={errors.phone}
              value={values.phone}
              onChange={(v) => set("phone", v)}
            />
          </div>
          <TextArea
            id={fieldId("note")}
            label={t("noteLabel")}
            hint={t("noteHint")}
            rows={4}
            maxLength={1500}
            value={values.note}
            onChange={(v) => set("note", v)}
          />
        </>
      ),
    },
  ];

  function dateLabel(v: Values) {
    if (!v.date) return "";
    const day = formatDay(v.date, tag, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const time = v.time ? ` · ${v.time} ${t("etShort")}` : "";
    return `${day}${time}${v.manualSlot ? `\n${t("toConfirm")}` : ""}`;
  }

  return (
    <JourneyShell
      back={{ href: "/finances", label: t("back") }}
      eyebrow={t("eyebrow")}
      title={t("title")}
      subtitle={t("subtitle")}
      icon="finance"
      aside={
        <>
          <JourneyAside title={t("asideTitle")} points={[t("aside1"), t("aside2"), t("aside3")]} />
          <p className="rounded-3xl border border-brand/20 bg-brand-soft/50 p-5 text-xs leading-relaxed text-muted">
            <strong className="block font-display text-sm text-ink">{t("disclaimerTitle")}</strong>
            {t("disclaimerText")}
          </p>
        </>
      }
    >
      <Wizard<Values>
        id="fin"
        kind="finance_appointment"
        initial={INITIAL}
        steps={steps}
        conflict={{ field: "time", message: t("errSlotTaken") }}
        summary={(v) => [
          {
            title: t("stepTopic"),
            step: 0,
            rows: [
              { label: t("topicLabel"), value: topicLabel(v.topic) },
              { label: t("topicDetailLabel"), value: v.topic === "other" ? v.topicDetail : "" },
            ],
          },
          { title: t("stepMode"), step: 1, rows: [{ label: t("modeLabel"), value: modeLabel(v.mode) }] },
          {
            title: t("stepDate"),
            step: 2,
            rows: [
              { label: t("sumWhen"), value: dateLabel(v) },
              { label: t("availabilityLabel"), value: v.manualSlot ? v.availability : "" },
            ],
          },
          {
            title: t("stepContact"),
            step: 3,
            rows: [
              { label: w("fName"), value: v.name },
              { label: w("fEmail"), value: v.email },
              { label: w("fPhone"), value: v.phone },
              { label: t("noteLabel"), value: v.note },
            ],
          },
        ]}
        toRequest={(v) => {
          const userTz = browserTimeZone();
          const noteParts = [
            v.topic === "other" && v.topicDetail.trim() ? `${t("topicDetailLabel")} : ${v.topicDetail.trim()}` : "",
            v.manualSlot ? t("noteManualSlot") : "",
            v.manualSlot && v.availability.trim() ? `${t("availabilityLabel")} : ${v.availability.trim()}` : "",
            userTz !== APPOINTMENT_TZ ? `${t("noteUserTz")} : ${userTz}` : "",
            v.note.trim(),
          ].filter(Boolean);
          return {
            name: v.name,
            email: v.email,
            phone: v.phone,
            payload: {
              topic: v.topic,
              mode: v.mode,
              date: v.date,
              time: v.time,
              timezone: APPOINTMENT_TZ,
              note: noteParts.length ? noteParts.join("\n") : undefined,
            },
          };
        }}
      />
    </JourneyShell>
  );
}
