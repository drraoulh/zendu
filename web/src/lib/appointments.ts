/**
 * Créneaux de rendez-vous Finances (contrat partagé).
 * Lundi–vendredi, plages horaires en heure de l'Est (America/Toronto), tranches de 30 minutes.
 * Plages configurables par APPOINTMENT_HOURS, ex. "09:00-17:00" (défaut) ou "09:00-12:00,13:00-17:00".
 * GET /api/appointments/slots?date=YYYY-MM-DD → { date, slots, timezone } (créneaux déjà pris retirés).
 */

export const APPOINTMENT_TIMEZONE = "America/Toronto";
export const SLOT_MINUTES = 30;
/** Réservation possible jusqu'à ce nombre de jours à l'avance. */
export const MAX_DAYS_AHEAD = 90;
const DEFAULT_HOURS = "09:00-17:00";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function toMinutes(hhmm: string): number | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(hhmm.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

function fromMinutes(n: number): string {
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}

/** Plages [début, fin[ en minutes depuis minuit. Valeur invalide → plage par défaut. */
export function appointmentRanges(raw: string | undefined = process.env.APPOINTMENT_HOURS): [number, number][] {
  const parse = (value: string) =>
    value
      .split(",")
      .map((part) => part.split("-").map((x) => toMinutes(x)))
      .filter((r): r is [number, number] => r.length === 2 && r[0] !== null && r[1] !== null && r[0] < r[1]);
  const ranges = raw && raw.trim() ? parse(raw) : [];
  return ranges.length > 0 ? ranges : parse(DEFAULT_HOURS);
}

/** Tous les débuts de créneau d'une journée ouvrée ("09:00", "09:30", …, "16:30"). */
export function daySchedule(raw?: string): string[] {
  const set = new Set<number>();
  for (const [start, end] of appointmentRanges(raw)) {
    for (let t = start; t + SLOT_MINUTES <= end; t += SLOT_MINUTES) set.add(t);
  }
  return [...set].sort((a, b) => a - b).map(fromMinutes);
}

/** Date valide du calendrier ? (rejette 2026-02-30). */
export function isValidDate(date: string): boolean {
  const m = DATE_RE.exec(date);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

export function isWeekend(date: string): boolean {
  const m = DATE_RE.exec(date);
  if (!m) return false;
  const day = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay();
  return day === 0 || day === 6;
}

/** Date et heure courantes à Toronto : { date: "YYYY-MM-DD", minutes }. */
export function nowInEastern(now: Date = new Date()): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APPOINTMENT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function addDays(date: string, days: number): string {
  const m = DATE_RE.exec(date)!;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days));
  return d.toISOString().slice(0, 10);
}

export type DateCheck = "ok" | "invalid_date" | "past_date" | "weekend" | "too_far";

/** Pourquoi une date n'est pas réservable (dates passées, week-ends, trop lointaines). */
export function checkAppointmentDate(date: string, now: Date = new Date()): DateCheck {
  if (!isValidDate(date)) return "invalid_date";
  const today = nowInEastern(now).date;
  if (date < today) return "past_date";
  if (date > addDays(today, MAX_DAYS_AHEAD)) return "too_far";
  if (isWeekend(date)) return "weekend";
  return "ok";
}

/**
 * Créneaux proposables pour une date (heure de l'Est), sans tenir compte des réservations :
 * [] pour un week-end, une date passée/invalide ou trop lointaine ; aujourd'hui, les créneaux
 * déjà commencés (ou dans moins d'une heure) sont retirés.
 */
export function availableSlots(date: string, now: Date = new Date()): string[] {
  if (checkAppointmentDate(date, now) !== "ok") return [];
  const slots = daySchedule();
  const current = nowInEastern(now);
  if (date !== current.date) return slots;
  return slots.filter((s) => (toMinutes(s) ?? 0) >= current.minutes + 60);
}
