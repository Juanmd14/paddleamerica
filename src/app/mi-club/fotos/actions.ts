"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  type FormState,
  isStorageUrl,
  optionalText,
  saveErrorMessage,
  text,
  wholeNumber,
} from "@/lib/admin-form";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/*
 * Álbum del club. Lo manejan el dueño del club y los admins; la base vuelve a
 * exigirlo con RLS (is_admin o is_club_owner) y con el trigger que controla
 * que el torneo sea del mismo club.
 */

async function requireClubEditor(clubId: number) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/mi-club");
  if (!user.isAdmin && !user.clubIds.includes(clubId)) notFound();
  return user;
}

async function revalidateAlbum(clubId: number) {
  const supabase = await createClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("slug")
    .eq("id", clubId)
    .maybeSingle();
  if (club) revalidatePath(`/clubes/${club.slug}`);
  revalidatePath("/mi-club/fotos");
  revalidatePath(`/admin/clubes/${clubId}`);
}

export async function addClubPhoto(
  clubId: number,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireClubEditor(clubId);

  const url = text(formData, "url");
  const caption = optionalText(formData, "caption");
  const tournamentId = wholeNumber(formData, "tournament_id") || null;

  const errors: Record<string, string> = {};
  if (!url || !isStorageUrl(url)) errors.url = "Subí una foto.";
  if ((caption ?? "").length > 140) {
    errors.caption = "El texto puede tener hasta 140 caracteres.";
  }
  if (Object.keys(errors).length > 0) return { errors };

  const supabase = await createClient();
  const { error } = await supabase.from("club_photos").insert({
    club_id: clubId,
    url,
    caption,
    tournament_id: tournamentId,
  });
  if (error) {
    if (error.message.includes("album_lleno")) {
      return {
        message: "El álbum llegó al máximo de 200 fotos. Borrá alguna vieja.",
      };
    }
    if (error.message.includes("torneo_de_otro_club")) {
      return { errors: { tournament_id: "Elegí un torneo de este club." } };
    }
    return { message: saveErrorMessage(error) };
  }

  await revalidateAlbum(clubId);
  return { ok: true };
}

export async function deleteClubPhoto(
  clubId: number,
  photoId: number,
): Promise<void> {
  await requireClubEditor(clubId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("club_photos")
    .delete()
    .eq("id", photoId)
    .eq("club_id", clubId);
  if (error) {
    console.error("[álbum: borrar foto]", error);
    throw new Error("No pudimos borrar la foto. Probá de nuevo.");
  }
  await revalidateAlbum(clubId);
}
