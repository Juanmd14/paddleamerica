"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { emailProfiles } from "@/lib/account-emails";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const STATUSES = ["pendiente", "confirmada", "rechazada"] as const;

/**
 * Borra una inscripción rechazada o cancelada para que esa pareja se pueda
 * volver a anotar. Le avisa al jugador.
 */
export async function releaseRegistration(
  registrationId: number,
): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: registration } = await supabase
    .from("tournament_registrations")
    .select("tournament:tournaments(id, slug)")
    .eq("id", registrationId)
    .maybeSingle();

  const { error } = await supabase.rpc("release_registration", {
    p_registration_id: registrationId,
  });
  if (error) {
    console.error("[liberar inscripción]", error);
    throw new Error("No pudimos liberar la inscripción. Probá de nuevo.");
  }

  const tournament = registration?.tournament;
  if (tournament) {
    revalidatePath(`/admin/torneos/${tournament.id}/inscripciones`);
    revalidatePath(`/torneos/${tournament.slug}`);
  }
  revalidatePath("/admin");
  revalidatePath("/admin/inscripciones");
  revalidatePath("/admin/torneos");
  revalidatePath("/mi-cuenta");
}
type Status = (typeof STATUSES)[number];

/** Cambia el estado. Al confirmar o rechazar avisa a los dos jugadores en su cuenta y por email. */
export async function setRegistrationStatus(
  registrationId: number,
  status: Status,
): Promise<void> {
  await requireAdmin();
  if (!STATUSES.includes(status)) return;

  const supabase = await createClient();
  const { data: registration, error } = await supabase
    .from("tournament_registrations")
    .select(
      "id, status, user_id, partner_id, partner_name, tournament:tournaments(id, name, slug)",
    )
    .eq("id", registrationId)
    .single();
  if (error) throw error;
  if (registration.status === status) return;
  // Mientras la pareja no acepta, solo se puede rechazar.
  if (registration.status === "invitacion" && status !== "rechazada") return;

  const { error: updateError } = await supabase
    .from("tournament_registrations")
    .update({ status })
    .eq("id", registrationId);
  if (updateError) throw updateError;

  const { tournament } = registration;
  if (status === "confirmada" || status === "rechazada") {
    const confirmed = status === "confirmada";
    const title = confirmed
      ? `Tu inscripción al ${tournament.name} fue confirmada`
      : `Tu inscripción al ${tournament.name} fue rechazada`;
    const body = confirmed
      ? "Ya tienen su lugar. ¡Nos vemos en la cancha!"
      : "La organización no pudo confirmar tu lugar. Si tenés dudas, escribinos.";

    const players = registration.partner_id
      ? [registration.user_id, registration.partner_id]
      : [registration.user_id];

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert(
        players.map((userId) => ({
          user_id: userId,
          title,
          body,
          href: `/torneos/${tournament.slug}#inscripcion`,
        })),
      );
    if (notificationError) console.error("[avisos]", notificationError);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("email, full_name")
      .in("id", players);
    after(() =>
      emailProfiles(profiles ?? [], {
        subject: title,
        title: confirmed ? "¡Inscripción confirmada!" : "Inscripción rechazada",
        paragraphs: [`${title}.`, body],
        button: {
          label: "Ver el torneo",
          path: `/torneos/${tournament.slug}#inscripcion`,
        },
      }),
    );
  }

  revalidatePath(`/admin/torneos/${tournament.id}/inscripciones`);
  revalidatePath("/admin");
  revalidatePath("/admin/inscripciones");
  revalidatePath("/admin/torneos");
  revalidatePath(`/torneos/${tournament.slug}`);
  revalidatePath("/mi-cuenta");
}
