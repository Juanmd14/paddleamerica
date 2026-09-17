/**
 * Categorías numeradas (1 = 1ra, la más alta … 8 = 8va) y las reglas de cada
 * torneo: un rango ("6ta a 8va") o una suma mínima de la pareja ("Suma 13").
 * La base de datos valida lo mismo al inscribirse (register_pair).
 */

const SUFFIXES = ["ra", "da", "ra", "ta", "ta", "ta", "ma", "va"];

export const CATEGORY_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** 1 → "1ra", 7 → "7ma". */
export function categoryName(value: number) {
  return `${value}${SUFFIXES[value - 1] ?? "ta"}`;
}

export const categoryOptions = CATEGORY_NUMBERS.map((value) => ({
  value,
  label: categoryName(value),
}));

export function isCategoryNumber(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 8;
}

export type CategoryRules = {
  category_min: number | null;
  category_max: number | null;
  category_sum: number | null;
};

/** "4ta", "1ra y 2da", "3ra a 5ta", "Suma 13" o null si el torneo no tiene reglas. */
export function categoryRulesLabel(rules: CategoryRules) {
  const { category_min: min, category_max: max, category_sum: sum } = rules;
  if (sum) return `Suma ${sum}`;
  if (!min || !max) return null;
  if (min === max) return categoryName(min);
  const joiner = max === min + 1 ? "y" : "a";
  return `${categoryName(min)} ${joiner} ${categoryName(max)}`;
}

/** Quiénes pueden jugar, en una frase. */
export function categoryRulesHelp(rules: CategoryRules) {
  const { category_min: min, category_max: max, category_sum: sum } = rules;
  if (sum) {
    return `Las categorías de los dos tienen que sumar ${sum} o más (ej. ${categoryName(Math.min(8, Math.ceil(sum / 2)))} + ${categoryName(Math.min(8, Math.floor(sum / 2)))}).`;
  }
  if (min && max) {
    const names = CATEGORY_NUMBERS.filter((n) => n >= min && n <= max).map(
      categoryName,
    );
    return names.length === 1
      ? `Solo pueden jugar jugadores de ${names[0]}.`
      : `Pueden jugar jugadores de ${new Intl.ListFormat("es", { type: "conjunction" }).format(names)}.`;
  }
  return "Se puede anotar cualquier categoría.";
}

/** Por qué un jugador solo no puede jugar el torneo (o null si puede). */
export function playerCategoryError(
  rules: CategoryRules,
  category: number | null,
) {
  if (!rules.category_min && !rules.category_sum) return null;
  if (!category)
    return "Todavía no tenés categoría. La asigna el organizador: hasta entonces no podés anotarte.";
  const { category_min: min, category_max: max } = rules;
  if (min && max && (category < min || category > max)) {
    return `Sos ${categoryName(category)} y este torneo es de ${categoryRulesLabel(rules)}.`;
  }
  return null;
}

/** Por qué la pareja no puede jugar (o null si puede). */
export function pairCategoryError(
  rules: CategoryRules,
  player: number | null,
  partner: number | null,
  partnerName = "Tu pareja",
) {
  const own = playerCategoryError(rules, player);
  if (own) return own;
  if (!rules.category_min && !rules.category_sum) return null;
  if (!partner)
    return `${partnerName} todavía no tiene categoría asignada por el organizador.`;

  const { category_min: min, category_max: max, category_sum: sum } = rules;
  if (min && max && (partner < min || partner > max)) {
    return `${partnerName} es ${categoryName(partner)} y este torneo es de ${categoryRulesLabel(rules)}.`;
  }
  if (sum && player && player + partner < sum) {
    return `Juntos suman ${player + partner} (${categoryName(player)} + ${categoryName(partner)}) y el torneo pide ${sum} o más.`;
  }
  return null;
}

/** "6ta" → 6, " 1RA " → 1. Null si no es de 1ra a 8va (igual que category_from_label en SQL). */
export function categoryFromLabel(label: string | null | undefined) {
  const match = (label ?? "")
    .trim()
    .toLowerCase()
    .match(/^([1-8])\s*(?:ra|da|ta|ma|va|°|º)?$/);
  return match ? Number(match[1]) : null;
}
