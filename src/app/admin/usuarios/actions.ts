"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type FormState, text, wholeNumber } from "@/lib/admin-form";
import { requireAdmin } from "@/lib/auth";
import {
  CATEGORY_NUMBERS,
  categoryName,
  isCategoryNumber,
} from "@/lib/categories";
import { getPlayerByProfileId, getProfileById } from "@/lib/data";
import { splitFullName } from "@/lib/points-import";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

/** Asigna (o quita, con "") la categoría de una cuenta. Le avisa al jugador. */
export async function setProfileCategory(
  userId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const value = text(formData, "category");
  const category = value ? Number(value) : undefined;
  if (category !== undefined && !isCategoryNumber(category)) {
    return { message: "Elegí una categoría." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_profile_category", {
    p_user_id: userId,
    p_category: category,
  });
  if (error) {
    return {
      message:
        error.message === "usuario_no_existe"
          ? "Esta cuenta ya no existe."
          : "No pudimos guardar la categoría. Probá de nuevo.",
    };
  }

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);
  return { ok: true };
}

const DELETE_ERRORS: Record<string, string> = {
  es_tu_cuenta: "No podés borrar tu propia cuenta.",
  es_admin: "No se puede borrar la cuenta de un admin.",
  inscripciones_activas:
    "Tiene inscripciones en torneos que todavía no terminaron. Cancelalas o esperá a que termine el torneo.",
  usuario_no_existe: "Esta cuenta ya no existe.",
};

/**
 * Borra una cuenta (perfil, avisos e inscripciones van en cascada) y su foto de
 * perfil. La base verifica que no sea un admin ni tenga torneos en curso.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.rpc("delete_user_account", {
    p_user_id: userId,
  });
  if (error) {
    const message =
      DELETE_ERRORS[error.message] ??
      "No pudimos borrar la cuenta. Probá de nuevo.";
    redirect(`/admin/usuarios?error=${encodeURIComponent(message)}`);
  }

  // Las fotos de perfil quedan en media/perfiles/<id>/.
  const folder = `perfiles/${userId}`;
  const { data: files } = await supabase.storage.from("media").list(folder);
  if (files?.length) {
    await supabase.storage
      .from("media")
      .remove(files.map((file) => `${folder}/${file.name}`));
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?borrada=1");
}

function revalidateUserPages(userId: string) {
  for (const path of [
    "/",
    "/jugadores",
    "/mi-cuenta",
    "/admin",
    "/admin/jugadores",
    "/admin/usuarios",
    `/admin/usuarios/${userId}`,
  ]) {
    revalidatePath(path);
  }
}

function backToUser(userId: string, params: Record<string, string>) {
  redirect(`/admin/usuarios/${userId}?${new URLSearchParams(params)}`);
}

/**
 * Suma una cuenta al ranking: crea su jugador vinculado con los puntos que ya
 * trae. Los puntos iniciales no cuentan como "ganados este mes".
 */
export async function addProfileToRanking(
  userId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const gender = text(formData, "gender");
  const category = text(formData, "category");
  const points = wholeNumber(formData, "ranking_points");

  const errors: Record<string, string> = {};
  if (gender !== "masculino" && gender !== "femenino") {
    errors.gender = "Elegí la rama.";
  }
  const categoryNumber = CATEGORY_NUMBERS.find(
    (value) => categoryName(value) === category,
  );
  if (!categoryNumber) errors.category = "Elegí la categoría.";
  if (Number.isNaN(points)) {
    errors.ranking_points = "Los puntos tienen que ser un número entero.";
  }
  if (Object.keys(errors).length > 0) return { errors };

  const profile = await getProfileById(userId);
  if (!profile) return { message: "Esta cuenta ya no existe." };
  if (await getPlayerByProfileId(userId)) {
    return { message: "Esta cuenta ya está en el ranking." };
  }
  const { firstName, lastName } = splitFullName(profile.full_name ?? "");
  if (!firstName) {
    return {
      message:
        "La cuenta no tiene nombre cargado. Pedile que lo complete en Mi cuenta.",
    };
  }

  const supabase = await createClient();
  const baseSlug = slugify(`${firstName} ${lastName}`) || profile.username;
  const { data: taken } = await supabase
    .from("players")
    .select("slug")
    .like("slug", `${baseSlug}%`);
  const slugs = new Set((taken ?? []).map((row) => row.slug));
  let slug = baseSlug;
  for (let suffix = 2; slugs.has(slug); suffix++)
    slug = `${baseSlug}-${suffix}`;

  const { error } = await supabase.from("players").insert({
    slug,
    first_name: firstName,
    last_name: lastName,
    gender,
    category,
    ranking_points: points,
    photo_url: profile.avatar_url,
    profile_id: userId,
  });
  if (error) {
    console.error("[sumar al ranking]", error);
    return {
      message:
        error.code === "23505"
          ? "Esta cuenta ya está en el ranking."
          : "No pudimos sumarlo al ranking. Probá de nuevo.",
    };
  }

  // La categoría de la cuenta y la del ranking quedan iguales.
  if (profile.category !== categoryNumber) {
    await supabase.rpc("set_profile_category", {
      p_user_id: userId,
      p_category: categoryNumber,
    });
  }

  revalidateUserPages(userId);
  return { ok: true };
}

/** Vincula una cuenta con un jugador que ya estaba en el ranking. */
export async function linkPlayerToProfile(
  userId: string,
  playerId: number,
): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .update({ profile_id: userId })
    .eq("id", playerId)
    .is("profile_id", null)
    .select("id");
  if (error || !data?.length) {
    backToUser(userId, {
      error:
        error?.code === "23505"
          ? "Esta cuenta ya tiene un jugador vinculado."
          : "No pudimos vincularlo: puede que ese jugador ya tenga otra cuenta.",
    });
  }
  revalidateUserPages(userId);
  backToUser(userId, { vinculado: "1" });
}

/** Separa la cuenta de su jugador. El jugador sigue en el ranking con sus puntos. */
export async function unlinkPlayerFromProfile(
  userId: string,
  playerId: number,
): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("players")
    .update({ profile_id: null })
    .eq("id", playerId)
    .eq("profile_id", userId);
  if (error) {
    backToUser(userId, { error: "No pudimos desvincularlo. Probá de nuevo." });
  }
  revalidateUserPages(userId);
  backToUser(userId, { desvinculado: "1" });
}

const ADMIN_ERRORS: Record<string, string> = {
  es_tu_cuenta: "No podés quitarte el permiso de admin a vos mismo.",
  usuario_no_existe: "Esta cuenta ya no existe.",
};

/** Nombra o quita un administrador. */
export async function setUserAdmin(
  userId: string,
  isAdmin: boolean,
): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_user_admin", {
    p_user_id: userId,
    p_is_admin: isAdmin,
  });
  if (error) {
    backToUser(userId, {
      error:
        ADMIN_ERRORS[error.message] ??
        "No pudimos cambiar el permiso. Probá de nuevo.",
    });
  }
  revalidateUserPages(userId);
  backToUser(userId, { admin: isAdmin ? "si" : "no" });
}
