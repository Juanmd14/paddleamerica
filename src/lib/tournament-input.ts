import { revalidatePath } from "next/cache";
import {
  isGoogleMapsUrl,
  isStorageUrl,
  isValidDate,
  optionalText,
  SLUG_PATTERN,
  text,
  wholeNumber,
} from "@/lib/admin-form";
import { MAX_AGE, MIN_AGE } from "@/lib/age-rules";
import {
  type CategoryRules,
  categoryRulesLabel,
  isCategoryNumber,
} from "@/lib/categories";
import { fromDateTimeLocal } from "@/lib/format";
import {
  featuredOptions,
  tournamentGenderOptions,
  tournamentStatusOptions,
} from "@/lib/labels";
import { slugify } from "@/lib/utils";
import type { TablesInsert } from "@/types/database.types";

/*
 * Lectura y validación del formulario de torneo. La usan el panel del admin
 * y el panel del club, así los dos guardan con las mismas reglas.
 */

/** Categoría del formulario: rango (desde/hasta), suma o texto libre. */
function readCategory(formData: FormData): {
  label: string;
  rules: CategoryRules;
  error?: string;
} {
  const none = { category_min: null, category_max: null, category_sum: null };
  const mode = text(formData, "category_mode");

  if (mode === "rango") {
    const from = Number(text(formData, "category_min"));
    const to = Number(text(formData, "category_max"));
    if (!isCategoryNumber(from) || !isCategoryNumber(to)) {
      return {
        label: "",
        rules: none,
        error: "Elegí desde qué categoría y hasta cuál.",
      };
    }
    const rules = {
      category_min: Math.min(from, to),
      category_max: Math.max(from, to),
      category_sum: null,
    };
    return { label: categoryRulesLabel(rules) ?? "", rules };
  }
  if (mode === "suma") {
    const sum = Number(text(formData, "category_sum"));
    if (!Number.isInteger(sum) || sum < 2 || sum > 16) {
      return { label: "", rules: none, error: "Elegí la suma de la pareja." };
    }
    const rules = { category_min: null, category_max: null, category_sum: sum };
    return { label: categoryRulesLabel(rules) ?? "", rules };
  }

  const label = text(formData, "category") || "Libre";
  return label.length > 60
    ? { label, rules: none, error: "El texto puede tener hasta 60 caracteres." }
    : { label, rules: none };
}

/** Límite de edad: vacío = sin límite. Un +30 es solo el mínimo; un -20, solo el máximo. */
function readAge(formData: FormData, field: "age_min" | "age_max") {
  const value = text(formData, field);
  if (!value) return { value: null };
  const age = Number(value);
  return Number.isInteger(age) && age >= MIN_AGE && age <= MAX_AGE
    ? { value: age }
    : { value: null, error: `Poné una edad de ${MIN_AGE} a ${MAX_AGE}, o dejalo vacío.` };
}

export function readTournament(formData: FormData) {
  const name = text(formData, "name");
  const startsOn = text(formData, "starts_on");
  const category = readCategory(formData);
  const ageMin = readAge(formData, "age_min");
  const ageMax = readAge(formData, "age_max");
  const featured = text(formData, "featured");
  const values: TablesInsert<"tournaments"> = {
    name,
    slug: text(formData, "slug") || slugify(`${name} ${startsOn.slice(0, 4)}`),
    description: optionalText(formData, "description"),
    city: text(formData, "city"),
    venue: optionalText(formData, "venue"),
    club_id: wholeNumber(formData, "club_id") || null,
    starts_on: startsOn,
    ends_on: text(formData, "ends_on") || startsOn,
    category: category.label,
    ...category.rules,
    age_min: ageMin.value,
    age_max: ageMax.value,
    featured: featured || null,
    sponsor_name:
      featured === "sponsor" ? optionalText(formData, "sponsor_name") : null,
    gender: text(formData, "gender"),
    status: text(formData, "status"),
    prize: optionalText(formData, "prize"),
    champions: optionalText(formData, "champions"),
    cover_url: optionalText(formData, "cover_url"),
    address: optionalText(formData, "address"),
    maps_url: optionalText(formData, "maps_url"),
    capacity: text(formData, "capacity")
      ? wholeNumber(formData, "capacity")
      : null,
    registration_opens_at: fromDateTimeLocal(
      text(formData, "registration_opens_at"),
    ),
  };

  const errors: Record<string, string> = {};
  if (name.length < 3 || name.length > 120)
    errors.name = "Poné el nombre del torneo.";
  if (!SLUG_PATTERN.test(values.slug)) {
    errors.slug =
      "Solo minúsculas, números y guiones (ej. abierto-de-primavera-2026).";
  }
  if (values.city.length < 2) errors.city = "Poné la ciudad.";
  if (!isValidDate(values.starts_on))
    errors.starts_on = "Elegí la fecha de inicio.";
  if (!isValidDate(values.ends_on)) {
    errors.ends_on = "Elegí la fecha de fin.";
  } else if (values.ends_on < values.starts_on) {
    errors.ends_on = "Termina antes de empezar.";
  }
  if (category.error) errors.category = category.error;
  if (ageMin.error || ageMax.error) {
    errors.age = ageMin.error ?? ageMax.error ?? "";
  } else if (
    ageMin.value !== null &&
    ageMax.value !== null &&
    ageMax.value < ageMin.value
  ) {
    errors.age = "La edad máxima no puede ser menor que la mínima.";
  }
  if (
    featured &&
    !featuredOptions.some((option) => option.value === featured)
  ) {
    errors.featured = "Elegí cómo destacarlo.";
  }
  if ((values.sponsor_name ?? "").length > 80) {
    errors.sponsor_name = "El sponsor puede tener hasta 80 caracteres.";
  }
  if (
    !tournamentGenderOptions.some((option) => option.value === values.gender)
  ) {
    errors.gender = "Elegí la rama.";
  }
  if (
    !tournamentStatusOptions.some((option) => option.value === values.status)
  ) {
    errors.status = "Elegí el estado.";
  }
  if (!isStorageUrl(values.cover_url ?? null))
    errors.cover_url = "Subí el flyer desde acá.";
  if ((values.address ?? "").length > 200) {
    errors.address = "La dirección puede tener hasta 200 caracteres.";
  }
  if (values.maps_url && !isGoogleMapsUrl(values.maps_url)) {
    errors.maps_url =
      "Pegá el link de Google Maps (tocá Compartir → Copiar vínculo).";
  }
  if (
    values.capacity !== null &&
    values.capacity !== undefined &&
    (Number.isNaN(values.capacity) || values.capacity < 1)
  ) {
    errors.capacity = "El cupo tiene que ser un número mayor a 0.";
  }
  if (
    text(formData, "registration_opens_at") &&
    !values.registration_opens_at
  ) {
    errors.registration_opens_at = "Elegí fecha y hora.";
  }

  return { values, errors };
}

/** Páginas donde aparece un torneo: el sitio, el panel del admin y el del club. */
export function revalidateTournamentPages(...slugs: string[]) {
  for (const path of [
    "/",
    "/torneos",
    "/admin",
    "/admin/torneos",
    "/mi-club",
    "/clubes",
    "/sitemap.xml",
  ]) {
    revalidatePath(path);
  }
  for (const slug of new Set(slugs)) revalidatePath(`/torneos/${slug}`);
  revalidatePath("/clubes/[slug]", "page");
}
