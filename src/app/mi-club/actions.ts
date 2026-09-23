"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { emailAccounts } from "@/lib/account-emails";
import { type FormState, saveErrorMessage } from "@/lib/admin-form";
import { requireClubOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  readTournament,
  revalidateTournamentPages,
} from "@/lib/tournament-input";

/*
 * Acciones del panel del club. Cada una vuelve a verificar que el usuario sea
 * dueño del club del torneo; además la base lo exige con RLS
 * (is_club_owner) y con club_set_registration_status, así que aunque alguien
 * arme el pedido a mano no puede tocar torneos de otro club.
 */

/** Lee el formulario sin los campos que solo maneja el admin. */
function readClubTournament(formData: FormData, clubIds: number[]) {
  const { values, errors } = readTournament(formData);
  // Destacar en el inicio es del admin (la base también lo ignora).
  delete values.featured;
  delete values.sponsor_name;
  delete errors.featured;
  delete errors.sponsor_name;
  if (!values.club_id || !clubIds.includes(values.club_id)) {
    errors.club_id = "Elegí tu club.";
  }
  return { values, errors };
}

/** El torneo, si es de uno de los clubes del usuario. Si no, 404. */
async function ownTournament(id: number, clubIds: number[]) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tournaments")
    .select("id, slug, club_id")
    .eq("id", id)
    .maybeSingle();
  if (!data?.club_id || !clubIds.includes(data.club_id)) {
    throw new Error("No encontramos ese torneo en tu club.");
  }
  return data;
}

export async function createClubTournament(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireClubOwner();
  const { values, errors } = readClubTournament(formData, user.clubIds);
  if (Object.keys(errors).length > 0) return { errors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournaments")
    .insert(values)
    .select("id")
    .single();
  if (error) {
    return error.code === "23505"
      ? { errors: { slug: "Ya hay un torneo con ese link." } }
      : { message: saveErrorMessage(error) };
  }

  revalidateTournamentPages(values.slug);
  redirect(`/mi-club/torneos/${data.id}?guardado=1`);
}

export async function updateClubTournament(
  id: number,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireClubOwner();
  const previous = await ownTournament(id, user.clubIds);
  const { values, errors } = readClubTournament(formData, user.clubIds);
  if (Object.keys(errors).length > 0) return { errors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournaments")
    .update(values)
    .eq("id", id)
    .select("id");
  if (error) {
    return error.code === "23505"
      ? { errors: { slug: "Ya hay un torneo con ese link." } }
      : { message: saveErrorMessage(error) };
  }
  // Sin filas: la base no lo dejó (no es de su club).
  if (data.length === 0) {
    return { message: "No tenés permiso para editar este torneo." };
  }

  revalidateTournamentPages(values.slug, previous.slug);
  revalidatePath(`/mi-club/torneos/${id}`);
  return { ok: true };
}

export async function deleteClubTournament(id: number): Promise<void> {
  const user = await requireClubOwner();
  const tournament = await ownTournament(id, user.clubIds);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tournaments")
    .delete()
    .eq("id", id)
    .select("id");
  if (error || data.length === 0) {
    // La base no deja borrar torneos con inscripciones.
    redirect(
      `/mi-club/torneos/${id}?error=${encodeURIComponent(
        error
          ? saveErrorMessage(error)
          : "Este torneo tiene inscripciones: no se puede borrar. Pasalo a Finalizado.",
      )}`,
    );
  }

  revalidateTournamentPages(tournament.slug);
  redirect("/mi-club?borrado=1");
}

const STATUSES = ["pendiente", "confirmada", "rechazada"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_ERRORS: Record<string, string> = {
  falta_que_acepte: "La pareja todavía no aceptó la invitación.",
  inscripcion_cancelada: "Los jugadores cancelaron esta inscripción.",
  sin_permiso: "Esta inscripción no es de un torneo de tu club.",
};

/** Confirma, rechaza o vuelve a pendiente. La base avisa a los dos jugadores. */
export async function setClubRegistrationStatus(
  tournamentId: number,
  registrationId: number,
  status: Status,
): Promise<void> {
  const user = await requireClubOwner();
  if (!STATUSES.includes(status)) return;
  const tournament = await ownTournament(tournamentId, user.clubIds);

  const supabase = await createClient();
  const { error } = await supabase.rpc("club_set_registration_status", {
    p_registration_id: registrationId,
    p_status: status,
  });
  if (error) {
    const known = Object.keys(STATUS_ERRORS).find((key) =>
      error.message.includes(key),
    );
    if (!known) console.error("[club: estado de inscripción]", error);
    throw new Error(
      known ? STATUS_ERRORS[known] : "No pudimos guardar. Probá de nuevo.",
    );
  }

  if (status === "confirmada" || status === "rechazada") {
    // El dueño nunca ve los emails: se buscan del lado del servidor.
    const { data: rows } = await supabase.rpc("club_tournament_registrations", {
      p_tournament_id: tournamentId,
    });
    const registration = rows?.find((row) => row.id === registrationId);
    const { data: info } = await supabase
      .from("tournaments")
      .select("name, slug")
      .eq("id", tournamentId)
      .single();
    if (registration && info) {
      const confirmed = status === "confirmada";
      const title = `Tu inscripción al ${info.name} fue ${confirmed ? "confirmada" : "rechazada"}`;
      after(() =>
        emailAccounts([registration.user_id, registration.partner_id], {
          subject: title,
          title: confirmed
            ? "¡Inscripción confirmada!"
            : "Inscripción rechazada",
          paragraphs: [
            `${title}.`,
            confirmed
              ? "Ya tienen su lugar. ¡Nos vemos en la cancha!"
              : "La organización no pudo confirmar tu lugar. Si tenés dudas, escribinos.",
          ],
          button: {
            label: "Ver el torneo",
            path: `/torneos/${info.slug}#inscripcion`,
          },
        }),
      );
    }
  }

  revalidatePath(`/mi-club/torneos/${tournamentId}/inscripciones`);
  revalidatePath("/mi-club");
  revalidatePath("/admin/inscripciones");
  revalidatePath(`/torneos/${tournament.slug}`);
  revalidatePath("/mi-cuenta");
}
