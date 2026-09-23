/**
 * Torneos con límite de edad: +30, -20, "de 35 a 45".
 *
 * La edad se cuenta al día que arranca el torneo, y el máximo es inclusive:
 * un -20 lo juega el que tiene 20 años el día que empieza.
 * Mismo orden y mismos códigos que la función SQL pair_age_error.
 */

export type AgeErrorCode =
  | "falta_fecha_nacimiento"
  | "edad_no_corresponde"
  | "pareja_sin_fecha_nacimiento"
  | "pareja_edad_no_corresponde";

export type AgeRules = {
  age_min: number | null;
  age_max: number | null;
};

export const MIN_AGE = 5;
export const MAX_AGE = 99;

/**
 * Años cumplidos en esa fecha. Las dos vienen como "2003-07-21" de Postgres:
 * se comparan por partes para no pasar por husos horarios (un new Date() de
 * "2003-07-21" es medianoche UTC y en Argentina cae el día anterior).
 */
export function ageOn(birthdate: string, on: string) {
  const [year, month, day] = birthdate.split("-").map(Number);
  const [onYear, onMonth, onDay] = on.split("-").map(Number);
  const before = onMonth < month || (onMonth === month && onDay < day);
  return onYear - year - (before ? 1 : 0);
}

/** Una fecha de nacimiento creíble: entre 5 y 100 años. Igual que is_valid_birthdate en SQL. */
export function isValidBirthdate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  if (month < 1 || month > 12) return false;
  // Día 0 del mes siguiente = último día de este mes, así "2003-02-31" no pasa.
  if (day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()) {
    return false;
  }

  const age = ageOn(value, todayISO(new Date()));
  return age >= 5 && age <= 100;
}

function todayISO(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function hasAgeRules(rules: AgeRules) {
  return rules.age_min !== null || rules.age_max !== null;
}

/** "+30", "-20", "30 a 40", o null si el torneo no tiene límite. */
export function ageRulesLabel({ age_min: min, age_max: max }: AgeRules) {
  if (min && max) return min === max ? `${min} años` : `${min} a ${max}`;
  if (min) return `+${min}`;
  if (max) return `-${max}`;
  return null;
}

/** " · +30" para pegar atrás de "6ta · Masculino". Vacío si no tiene límite. */
export function ageLabelSuffix(rules: AgeRules) {
  const label = ageRulesLabel(rules);
  return label ? ` · ${label}` : "";
}

/** Quiénes pueden jugar, en una frase. */
export function ageRulesHelp({ age_min: min, age_max: max }: AgeRules) {
  if (min && max) {
    return min === max
      ? `Juegan los que tienen ${min} años cuando arranca el torneo.`
      : `Juegan de ${min} a ${max} años (la edad que tengas cuando arranca el torneo).`;
  }
  if (min) {
    return `Juegan de ${min} años en adelante (la edad que tengas cuando arranca el torneo).`;
  }
  if (max) {
    return `Juegan hasta ${max} años inclusive (la edad que tengas cuando arranca el torneo).`;
  }
  return "";
}

function outOfRange(rules: AgeRules, birthdate: string, startsOn: string) {
  const age = ageOn(birthdate, startsOn);
  return (
    (rules.age_min !== null && age < rules.age_min) ||
    (rules.age_max !== null && age > rules.age_max)
  );
}

export function pairAgeErrorCode(
  rules: AgeRules,
  startsOn: string,
  player: string | null,
  partner: string | null,
): AgeErrorCode | null {
  if (!hasAgeRules(rules)) return null;
  if (!player) return "falta_fecha_nacimiento";
  if (outOfRange(rules, player, startsOn)) return "edad_no_corresponde";
  if (!partner) return "pareja_sin_fecha_nacimiento";
  if (outOfRange(rules, partner, startsOn)) return "pareja_edad_no_corresponde";
  return null;
}

/** Mensaje para cada código (también los que devuelve la base al anotarse). */
export function ageErrorMessage(
  code: string,
  rules: AgeRules,
  partnerName = "Tu pareja",
): string | null {
  const label = ageRulesLabel(rules) ?? "";
  const messages: Record<AgeErrorCode, string> = {
    falta_fecha_nacimiento:
      "Este torneo tiene límite de edad y todavía no cargaste tu fecha de nacimiento. Cargala en Mi cuenta → Mis datos para poder anotarte.",
    edad_no_corresponde: `Por tu edad no entrás en este torneo (es ${label}).`,
    pareja_sin_fecha_nacimiento: `${partnerName} todavía no cargó su fecha de nacimiento, y este torneo tiene límite de edad. Pedile que la cargue en Mi cuenta → Mis datos.`,
    pareja_edad_no_corresponde: `${partnerName} no entra en este torneo por su edad (es ${label}).`,
  };
  return code in messages ? messages[code as AgeErrorCode] : null;
}

/** Problemas de la edad propia (sin mirar a la pareja): null si puede anotarse. */
export function playerAgeError(
  rules: AgeRules,
  startsOn: string,
  birthdate: string | null,
) {
  const code = pairAgeErrorCode(rules, startsOn, birthdate, birthdate);
  return code === "falta_fecha_nacimiento" || code === "edad_no_corresponde"
    ? ageErrorMessage(code, rules)
    : null;
}

/** Por qué la pareja no puede jugar por la edad (null si puede). */
export function pairAgeError(
  rules: AgeRules,
  startsOn: string,
  player: string | null,
  partner: string | null,
  partnerName = "Tu pareja",
) {
  const code = pairAgeErrorCode(rules, startsOn, player, partner);
  return code ? ageErrorMessage(code, rules, partnerName) : null;
}
