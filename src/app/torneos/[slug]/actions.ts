"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getTournament } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type RegistrationFormState = {
  message?: string;
  errors?: Partial<
    Record<"partner_name" | "contact_phone" | "category" | "notes", string>
  >;
  values?: Record<string, string>;
};

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function registerForTournament(
  slug: string,
  _prevState: RegistrationFormState,
  formData: FormData,
): Promise<RegistrationFormState> {
  const values = {
    partner_name: field(formData, "partner_name"),
    contact_phone: field(formData, "contact_phone"),
    category: field(formData, "category"),
    notes: field(formData, "notes"),
  };

  if (!isSupabaseConfigured) {
    return { message: "Las inscripciones no están disponibles.", values };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { message: "Tu sesión expiró. Ingresá de nuevo.", values };
  }

  const errors: RegistrationFormState["errors"] = {};
  if (values.partner_name.length < 3) {
    errors.partner_name = "Escribí el nombre y apellido de tu pareja.";
  }
  if (values.partner_name.length > 120) {
    errors.partner_name = "El nombre es demasiado largo.";
  }
  const digits = values.contact_phone.replace(/\D/g, "");
  if (digits.length < 8 || values.contact_phone.length > 30) {
    errors.contact_phone = "Poné un teléfono válido, con característica.";
  }
  if (values.category.length > 60) {
    errors.category = "La categoría es demasiado larga.";
  }
  if (values.notes.length > 500) {
    errors.notes = "Las observaciones pueden tener hasta 500 caracteres.";
  }
  if (Object.keys(errors).length > 0) {
    return { errors, values };
  }

  const tournament = await getTournament(slug);
  if (!tournament || tournament.status !== "inscripciones") {
    return {
      message: "Las inscripciones para este torneo están cerradas.",
      values,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tournament_registrations").insert({
    tournament_id: tournament.id,
    partner_name: values.partner_name,
    contact_phone: values.contact_phone,
    category: values.category || null,
    notes: values.notes || null,
  });

  if (error) {
    // 23505: ya existe una inscripción de este usuario para el torneo.
    // cupo_completo: lo lanza el trigger de cupos si se llenó mientras se anotaba.
    const message =
      error.code === "23505"
        ? "Ya estás inscripto en este torneo."
        : error.message === "cupo_completo"
          ? "Se completó el cupo mientras te anotabas. Si se libera un lugar, vas a poder anotarte."
          : "No pudimos guardar la inscripción. Probá de nuevo.";
    if (error.message === "cupo_completo") revalidatePath(`/torneos/${slug}`);
    return { message, values };
  }

  revalidatePath(`/torneos/${slug}`);
  revalidatePath("/mi-cuenta");
  return {};
}

export async function cancelRegistration(
  registrationId: number,
  slug: string,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  // RLS solo deja borrar inscripciones propias de torneos con inscripciones abiertas.
  const supabase = await createClient();
  const { error } = await supabase
    .from("tournament_registrations")
    .delete()
    .eq("id", registrationId)
    .eq("user_id", user.id);
  if (error) throw error;

  revalidatePath(`/torneos/${slug}`);
  revalidatePath("/mi-cuenta");
}
