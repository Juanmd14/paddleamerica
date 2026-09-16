"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  type FormState,
  isStorageUrl,
  isValidDate,
  optionalText,
  SLUG_PATTERN,
  saveErrorMessage,
  text,
  wholeNumber,
} from "@/lib/admin-form";
import { requireAdmin } from "@/lib/auth";
import { tournamentGenderOptions, tournamentStatusOptions } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { TablesInsert } from "@/types/database.types";

/** Links que da Google Maps al compartir un lugar. */
function isGoogleMapsUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "maps.app.goo.gl" ||
        url.hostname === "goo.gl" ||
        /(^|\.)google\.[a-z.]+$/.test(url.hostname))
    );
  } catch {
    return false;
  }
}

function readTournament(formData: FormData) {
  const name = text(formData, "name");
  const startsOn = text(formData, "starts_on");
  const values: TablesInsert<"tournaments"> = {
    name,
    slug: text(formData, "slug") || slugify(`${name} ${startsOn.slice(0, 4)}`),
    description: optionalText(formData, "description"),
    city: text(formData, "city"),
    venue: optionalText(formData, "venue"),
    starts_on: startsOn,
    ends_on: text(formData, "ends_on") || startsOn,
    category: text(formData, "category"),
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
    registration_opens_on: optionalText(formData, "registration_opens_on"),
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
  if (values.category.length < 1 || values.category.length > 60) {
    errors.category = "Poné la categoría (ej. 1ra y 2da, Suma 13).";
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
    values.registration_opens_on &&
    !isValidDate(values.registration_opens_on)
  ) {
    errors.registration_opens_on = "Elegí una fecha válida.";
  }

  return { values, errors };
}

function revalidateTournamentPages(...slugs: string[]) {
  for (const path of [
    "/",
    "/torneos",
    "/admin",
    "/admin/torneos",
    "/sitemap.xml",
  ]) {
    revalidatePath(path);
  }
  for (const slug of new Set(slugs)) revalidatePath(`/torneos/${slug}`);
}

export async function createTournament(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const { values, errors } = readTournament(formData);
  if (Object.keys(errors).length > 0) return { errors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournaments")
    .insert(values)
    .select("id")
    .single();
  if (error) {
    return error.code === "23505"
      ? { errors: { slug: "Ya hay un torneo con ese slug." } }
      : { message: saveErrorMessage(error) };
  }

  revalidateTournamentPages(values.slug);
  redirect(`/admin/torneos/${data.id}?guardado=1`);
}

export async function updateTournament(
  id: number,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const { values, errors } = readTournament(formData);
  if (Object.keys(errors).length > 0) return { errors };

  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("tournaments")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("tournaments")
    .update(values)
    .eq("id", id);
  if (error) {
    return error.code === "23505"
      ? { errors: { slug: "Ya hay un torneo con ese slug." } }
      : { message: saveErrorMessage(error) };
  }

  revalidateTournamentPages(values.slug, previous?.slug ?? values.slug);
  revalidatePath(`/admin/torneos/${id}`);
  return { ok: true };
}

export async function deleteTournament(id: number): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { count } = await supabase
    .from("tournament_registrations")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", id);
  if ((count ?? 0) > 0) {
    redirect(
      `/admin/torneos/${id}?error=${encodeURIComponent(
        "Este torneo tiene inscripciones: no se puede borrar. Pasalo a Finalizado.",
      )}`,
    );
  }

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("tournaments").delete().eq("id", id);
  if (error) {
    redirect(
      `/admin/torneos/${id}?error=${encodeURIComponent(saveErrorMessage(error))}`,
    );
  }

  revalidateTournamentPages(tournament?.slug ?? "");
  redirect("/admin/torneos?borrado=1");
}
