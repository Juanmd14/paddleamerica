"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type FormState, saveErrorMessage } from "@/lib/admin-form";
import { requireAdmin } from "@/lib/auth";
import {
  readTournament,
  revalidateTournamentPages,
} from "@/lib/tournament-input";
import { createClient } from "@/lib/supabase/server";

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
