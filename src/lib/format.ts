export const APP_TIME_ZONE = "America/Argentina/Buenos_Aires";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: APP_TIME_ZONE,
});

const dayMonthFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  timeZone: APP_TIME_ZONE,
});

const numberFormatter = new Intl.NumberFormat("es-AR");

/** Las fechas "YYYY-MM-DD" se leen al mediodía para evitar corrimientos de zona horaria. */
function parseDate(value: string) {
  return new Date(value.length === 10 ? `${value}T12:00:00-03:00` : value);
}

export function formatDate(value: string) {
  return dateFormatter.format(parseDate(value));
}

/** "9 al 11 de octubre de 2026" o "30 de octubre al 1 de noviembre de 2026". */
export function formatDateRange(start: string, end: string) {
  if (start === end) return formatDate(start);

  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);

  const from = sameMonth
    ? String(startDate.getDate())
    : dayMonthFormatter.format(startDate);
  return `${from} al ${dateFormatter.format(endDate)}`;
}

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}
