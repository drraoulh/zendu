/** Utilitaires de dates pour la prise de rendez-vous (créneaux exprimés en heure de l'Est). */

export const APPOINTMENT_TZ = "America/Toronto";

/** Date du jour (YYYY-MM-DD) dans un fuseau donné. */
export function todayIn(timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
      new Date(),
    );
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Jours ouvrés (lun–ven) des `weeks` prochaines semaines, à partir de demain (heure de l'Est). */
export function upcomingBusinessDays(weeks = 3): string[] {
  const start = parseYmd(todayIn(APPOINTMENT_TZ));
  const days: string[] = [];
  for (let i = 1; i <= weeks * 7; i++) {
    const d = new Date(start.getTime() + i * 86_400_000);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) days.push(toYmd(d));
  }
  return days;
}

export function isBusinessDay(ymd: string): boolean {
  const wd = parseYmd(ymd).getUTCDay();
  return wd !== 0 && wd !== 6;
}

export function formatDay(ymd: string, localeTag: string, opts: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(localeTag, { ...opts, timeZone: "UTC" }).format(parseYmd(ymd));
  } catch {
    return ymd;
  }
}

/** Décalage (minutes) d'un fuseau à un instant donné. */
function offsetMinutes(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"));
  return Math.round((asUtc - utcMs) / 60_000);
}

/** Convertit une date + heure locales d'un fuseau en instant UTC. */
export function zonedToInstant(ymd: string, hhmm: string, timeZone: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const first = guess - offsetMinutes(guess, timeZone) * 60_000;
  return new Date(guess - offsetMinutes(first, timeZone) * 60_000);
}

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || APPOINTMENT_TZ;
  } catch {
    return APPOINTMENT_TZ;
  }
}

/** Heure d'un créneau dans le fuseau de l'utilisateur (null si c'est le même fuseau). */
export function localEquivalent(ymd: string, hhmm: string, userTz: string, localeTag: string): string | null {
  try {
    const instant = zonedToInstant(ymd, hhmm, APPOINTMENT_TZ);
    if (offsetMinutes(instant.getTime(), userTz) === offsetMinutes(instant.getTime(), APPOINTMENT_TZ)) return null;
    return new Intl.DateTimeFormat(localeTag, {
      timeZone: userTz,
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
    }).format(instant);
  } catch {
    return null;
  }
}

/** Créneaux par défaut (9:00–16:30, toutes les 30 min) utilisés si l'API est indisponible : à confirmer par l'équipe. */
export function fallbackSlots(): string[] {
  const out: string[] = [];
  for (let m = 9 * 60; m < 17 * 60; m += 30) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}
