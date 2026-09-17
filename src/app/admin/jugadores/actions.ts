"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  type FormState,
  isStorageUrl,
  optionalText,
  SLUG_PATTERN,
  saveErrorMessage,
  text,
  wholeNumber,
} from "@/lib/admin-form";
import { requireAdmin } from "@/lib/auth";
import { playerGenderOptions, sideOptions } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { TablesInsert } from "@/types/database.types";

function readPlayer(formData: FormData) {
  const firstName = text(formData, "first_name");
  const lastName = text(formData, "last_name");
  const values: TablesInsert<"players"> = {
    first_name: firstName,
    last_name: lastName,
    slug: text(formData, "slug") || slugify(`${firstName} ${lastName}`),
    gender: text(formData, "gender"),
    category: text(formData, "category"),
    side: optionalText(formData, "side"),
    club: optionalText(formData, "club"),
    city: optionalText(formData, "city"),
    photo_url: optionalText(formData, "photo_url"),
    bio: optionalText(formData, "bio"),
    // Al editar no viene: los puntos se corrigen con adjustPlayerPoints.
    ranking_points: formData.has("ranking_points")
      ? wholeNumber(formData, "ranking_points")
      : undefined,
    matches_played: wholeNumber(formData, "matches_played"),
    matches_won: wholeNumber(formData, "matches_won"),
    titles: wholeNumber(formData, "titles"),
    active: !formData.has("inactive"),
  };

  const errors: Record<string, string> = {};
  if (firstName.length < 2) errors.first_name = "Poné el nombre.";
  if (lastName.length < 2) errors.last_name = "Poné el apellido.";
  if (!SLUG_PATTERN.test(values.slug)) {
    errors.slug = "Solo minúsculas, números y guiones.";
  }
  if (!playerGenderOptions.some((option) => option.value === values.gender)) {
    errors.gender = "Elegí la rama.";
  }
  if (values.category.length < 1 || values.category.length > 30) {
    errors.category = "Poné la categoría (ej. 1ra).";
  }
  if (
    values.side &&
    !sideOptions.some((option) => option.value === values.side)
  ) {
    errors.side = "Elegí drive o revés.";
  }
  for (const [name, label] of [
    ["ranking_points", "Los puntos"],
    ["matches_played", "Los partidos jugados"],
    ["matches_won", "Los partidos ganados"],
    ["titles", "Los títulos"],
  ] as const) {
    if (Number.isNaN(values[name])) {
      errors[name] = `${label} tienen que ser un número entero.`;
    }
  }
  if (
    !errors.matches_won &&
    !errors.matches_played &&
    (values.matches_won ?? 0) > (values.matches_played ?? 0)
  ) {
    errors.matches_won = "No puede ganar más partidos de los que jugó.";
  }
  if (!isStorageUrl(values.photo_url ?? null)) {
    errors.photo_url = "Subí la foto desde acá.";
  }

  return { values, errors };
}

function revalidatePlayerPages(...slugs: string[]) {
  for (const path of [
    "/",
    "/jugadores",
    "/admin",
    "/admin/jugadores",
    "/sitemap.xml",
  ]) {
    revalidatePath(path);
  }
  for (const slug of new Set(slugs)) revalidatePath(`/jugadores/${slug}`);
}

export async function createPlayer(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const { values, errors } = readPlayer(formData);
  if (Object.keys(errors).length > 0) return { errors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .insert(values)
    .select("id")
    .single();
  if (error) {
    return error.code === "23505"
      ? { errors: { slug: "Ya hay un jugador con ese slug." } }
      : { message: saveErrorMessage(error) };
  }

  revalidatePlayerPages(values.slug);
  redirect(`/admin/jugadores/${data.id}?guardado=1`);
}

export async function updatePlayer(
  id: number,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const { values, errors } = readPlayer(formData);
  if (Object.keys(errors).length > 0) return { errors };

  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("players")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("players").update(values).eq("id", id);
  if (error) {
    if (error.message === "categoria_del_jugador_invalida") {
      return {
        errors: {
          category:
            "Tiene una cuenta vinculada: usá una categoría de 1ra a 8va (ej. 6ta).",
        },
      };
    }
    return error.code === "23505"
      ? { errors: { slug: "Ya hay un jugador con ese slug." } }
      : { message: saveErrorMessage(error) };
  }

  revalidatePlayerPages(values.slug, previous?.slug ?? values.slug);
  revalidatePath(`/admin/jugadores/${id}`);
  return { ok: true };
}

export type AdjustPointsState = {
  message?: string;
  errors?: Partial<Record<"amount" | "reason", string>>;
  total?: number;
  savedAt?: number;
};

/** Suma o resta puntos con un motivo (queda en el historial del jugador). */
export async function adjustPlayerPoints(
  id: number,
  _prevState: AdjustPointsState,
  formData: FormData,
): Promise<AdjustPointsState> {
  await requireAdmin();
  const amount = wholeNumber(formData, "amount", Number.NaN);
  const reason = text(formData, "reason");
  const sign = text(formData, "direction") === "restar" ? -1 : 1;

  const errors: AdjustPointsState["errors"] = {};
  if (Number.isNaN(amount) || amount < 1) {
    errors.amount = "Poné cuántos puntos.";
  }
  if (reason.length < 3 || reason.length > 150) {
    errors.reason = "Contá brevemente por qué (se guarda en el historial).";
  }
  if (Object.keys(errors).length > 0) return { errors };

  const supabase = await createClient();
  const { data: total, error } = await supabase.rpc("adjust_player_points", {
    p_player_id: id,
    p_delta: sign * amount,
    p_reason: reason,
  });
  if (error) {
    return {
      message:
        error.message === "puntos_negativos"
          ? "No puede quedar con puntos negativos."
          : "No pudimos corregir los puntos. Probá de nuevo.",
    };
  }

  const { data: player } = await supabase
    .from("players")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  revalidatePlayerPages(player?.slug ?? "");
  revalidatePath(`/admin/jugadores/${id}`);
  return { total, savedAt: Date.now() };
}

export async function deletePlayer(id: number): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: player } = await supabase
    .from("players")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) {
    redirect(
      `/admin/jugadores/${id}?error=${encodeURIComponent(saveErrorMessage(error))}`,
    );
  }

  revalidatePlayerPages(player?.slug ?? "");
  redirect("/admin/jugadores?borrado=1");
}
