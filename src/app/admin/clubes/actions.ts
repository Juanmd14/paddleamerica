"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  type FormState,
  isGoogleMapsUrl,
  isStorageUrl,
  optionalText,
  SLUG_PATTERN,
  saveErrorMessage,
  text,
  wholeNumber,
} from "@/lib/admin-form";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { TablesInsert } from "@/types/database.types";

function readClub(formData: FormData) {
  const name = text(formData, "name");
  const courts = text(formData, "courts")
    ? wholeNumber(formData, "courts")
    : null;
  const values: TablesInsert<"clubs"> = {
    name,
    slug: text(formData, "slug") || slugify(name),
    city: text(formData, "city"),
    address: optionalText(formData, "address"),
    maps_url: optionalText(formData, "maps_url"),
    description: optionalText(formData, "description"),
    courts,
    phone: optionalText(formData, "phone"),
    instagram: optionalText(formData, "instagram")?.replace(/^@/, "") ?? null,
    cover_url: optionalText(formData, "cover_url"),
  };

  const errors: Record<string, string> = {};
  if (name.length < 2 || name.length > 80) {
    errors.name = "Poné el nombre del club (2 a 80 caracteres).";
  }
  if (!SLUG_PATTERN.test(values.slug)) {
    errors.slug = "Solo minúsculas, números y guiones.";
  }
  if (values.city.length < 2) errors.city = "Poné la ciudad.";
  if ((values.address ?? "").length > 200) {
    errors.address = "La dirección puede tener hasta 200 caracteres.";
  }
  if (values.maps_url && !isGoogleMapsUrl(values.maps_url)) {
    errors.maps_url =
      "Pegá el link de Google Maps (tocá Compartir → Copiar vínculo).";
  }
  if (courts !== null && (Number.isNaN(courts) || courts < 1 || courts > 50)) {
    errors.courts = "Poné un número de canchas entre 1 y 50.";
  }
  if ((values.description ?? "").length > 2000) {
    errors.description = "La descripción puede tener hasta 2000 caracteres.";
  }
  if ((values.phone ?? "").length > 30) {
    errors.phone = "El teléfono puede tener hasta 30 caracteres.";
  }
  if (values.instagram && !/^[A-Za-z0-9._]{1,60}$/.test(values.instagram)) {
    errors.instagram =
      "Poné solo el usuario, sin espacios (ej. complejoelremate).";
  }
  if (!isStorageUrl(values.cover_url ?? null)) {
    errors.cover_url = "Subí la foto desde acá.";
  }

  return { values, errors };
}

function revalidateClubPages(...slugs: string[]) {
  for (const path of ["/clubes", "/admin/clubes", "/sitemap.xml"]) {
    revalidatePath(path);
  }
  for (const slug of new Set(slugs)) revalidatePath(`/clubes/${slug}`);
  // Los torneos muestran el link a su club.
  revalidatePath("/torneos/[slug]", "page");
}

export async function createClub(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const { values, errors } = readClub(formData);
  if (Object.keys(errors).length > 0) return { errors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clubs")
    .insert(values)
    .select("id")
    .single();
  if (error) {
    return error.code === "23505"
      ? { errors: { slug: "Ya hay un club con ese link." } }
      : { message: saveErrorMessage(error) };
  }

  revalidateClubPages(values.slug);
  redirect(`/admin/clubes/${data.id}?guardado=1`);
}

export async function updateClub(
  id: number,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const { values, errors } = readClub(formData);
  if (Object.keys(errors).length > 0) return { errors };

  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("clubs")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("clubs").update(values).eq("id", id);
  if (error) {
    return error.code === "23505"
      ? { errors: { slug: "Ya hay un club con ese link." } }
      : { message: saveErrorMessage(error) };
  }

  revalidateClubPages(values.slug, previous?.slug ?? values.slug);
  revalidatePath(`/admin/clubes/${id}`);
  return { ok: true };
}

/** Borra el club. Sus torneos quedan sin club (conservan la sede escrita). */
export async function deleteClub(id: number): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("clubs").delete().eq("id", id);
  if (error) {
    redirect(
      `/admin/clubes/${id}?error=${encodeURIComponent(saveErrorMessage(error))}`,
    );
  }

  revalidateClubPages(club?.slug ?? "");
  redirect("/admin/clubes?borrado=1");
}

function revalidateClubOwners(clubId: number) {
  revalidatePath(`/admin/clubes/${clubId}`);
  revalidatePath("/mi-club");
}

/** Vincula como dueño del club a la cuenta con ese @usuario. */
export async function addClubOwner(
  clubId: number,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const username = text(formData, "username").replace(/^@/, "").toLowerCase();
  if (!username) {
    return { errors: { username: "Escribí el @usuario de la cuenta." } };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, is_admin")
    .eq("username", username)
    .maybeSingle();
  if (!profile) {
    return { errors: { username: `No hay ninguna cuenta @${username}.` } };
  }

  const { error } = await supabase.rpc("set_club_owner", {
    p_club_id: clubId,
    p_user_id: profile.id,
    p_owner: true,
  });
  if (error) return { message: saveErrorMessage(error) };

  revalidateClubOwners(clubId);
  return { ok: true };
}

export async function removeClubOwner(
  clubId: number,
  userId: string,
): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_club_owner", {
    p_club_id: clubId,
    p_user_id: userId,
    p_owner: false,
  });
  if (error) {
    redirect(
      `/admin/clubes/${clubId}?error=${encodeURIComponent(saveErrorMessage(error))}`,
    );
  }
  revalidateClubOwners(clubId);
}
