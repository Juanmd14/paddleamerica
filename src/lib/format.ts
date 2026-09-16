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

const dayFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  timeZone: APP_TIME_ZONE,
});

const monthFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  timeZone: APP_TIME_ZONE,
});

const shortMonthFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "short",
  timeZone: APP_TIME_ZONE,
});

const yearFormatter = new Intl.DateTimeFormat("es-AR", {
  year: "numeric",
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

/** "9 al 11 de octubre de 2026", "30 de octubre al 1 de noviembre de 2026" o, si cambia el año, las dos fechas completas. */
export function formatDateRange(start: string, end: string) {
  if (start === end) return formatDate(start);

  const startDate = parseDate(start);
  const endDate = parseDate(end);

  if (start.slice(0, 4) !== end.slice(0, 4)) {
    return `${dateFormatter.format(startDate)} al ${dateFormatter.format(endDate)}`;
  }

  const from =
    start.slice(0, 7) === end.slice(0, 7)
      ? dayFormatter.format(startDate)
      : dayMonthFormatter.format(startDate);
  return `${from} al ${dateFormatter.format(endDate)}`;
}

/** Versión corta para flyers: { month: "octubre", days: "9 al 11" } o { month: "oct · nov", days: "30 al 1" }. */
export function formatFlyerDate(start: string, end: string) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);

  const month = sameMonth
    ? monthFormatter.format(startDate)
    : `${shortMonthFormatter.format(startDate)} · ${shortMonthFormatter.format(endDate)}`;
  const days =
    start === end
      ? dayFormatter.format(startDate)
      : `${dayFormatter.format(startDate)} al ${dayFormatter.format(endDate)}`;

  return { month: month.replaceAll(".", ""), days };
}

/** Año actual en la zona horaria del sitio. */
export function currentYear() {
  return Number(yearFormatter.format(new Date()));
}

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

const dateTimePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: APP_TIME_ZONE,
});

/** Fecha ISO → valor de <input type="datetime-local"> en hora argentina ("2026-09-17T10:30"). */
export function toDateTimeLocal(value: string | Date) {
  const parts = Object.fromEntries(
    dateTimePartsFormatter
      .formatToParts(typeof value === "string" ? new Date(value) : value)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Valor de <input type="datetime-local"> (hora argentina) → ISO. Null si no es válido. */
export function fromDateTimeLocal(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00-03:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

const monthNameFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  timeZone: APP_TIME_ZONE,
});

/** Año y mes actuales en hora argentina: { year: "2026", yearMonth: "2026-09", monthName: "septiembre" }. */
export function currentPeriod(date = new Date()) {
  const local = toDateTimeLocal(date);
  return {
    year: local.slice(0, 4),
    yearMonth: local.slice(0, 7),
    monthName: monthNameFormatter.format(date),
  };
}

const shortDateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "numeric",
  timeZone: APP_TIME_ZONE,
});

/** "2026-10-20" → "20/10". */
export function formatShortDate(value: string) {
  return shortDateFormatter.format(parseDate(value));
}
