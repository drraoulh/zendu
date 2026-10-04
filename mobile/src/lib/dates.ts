const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/** « mardi 6 octobre 2026 » à partir de YYYY-MM-DD. */
export function frenchDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${WEEKDAYS[dt.getDay()]} ${d} ${MONTHS[m - 1]} ${y}`;
}

/** « 10 h 30 » à partir de HH:mm. */
export const hhmm = (t: string) => t.replace(":", " h ");
