"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, safeAvatarUrl } from "@/lib/auth";
import {
  categoryName,
  categoryRulesLabel,
  pairCategoryError,
} from "@/lib/categories";
import { getMyProfile, getTournament } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type RegistrationFormState = {
  message?: string;
  errors?: Partial<
    Record<"partner_username" | "contact_phone" | "notes", string>
  >;
  values?: Record<string, string>;
};

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

/** Mensaje para cada error que devuelven register_pair, respond_invitation y cancel_registration. */
function registrationErrorMessage(
  code: string,
  context: { rules?: string | null; partner?: string } = {},
) {
  const partner = context.partner || "Tu pareja";
  const rules = context.rules ? ` (es de ${context.rules})` : "";
  const messages: Record<string, string> = {
    sin_sesion: "Tu sesión expiró. Ingresá de nuevo.",
    inscripciones_cerradas:
      "Las inscripciones para este torneo están cerradas.",
    pareja_no_existe:
      "No encontramos ese usuario. Fijate que esté bien escrito y que tu pareja tenga cuenta.",
    pareja_sos_vos: "Tenés que invitar a otra persona.",
    telefono_invalido: "Poné un teléfono válido, con característica.",
    notas_largas: "Las observaciones pueden tener hasta 500 caracteres.",
    falta_categoria: "Cargá tu categoría en Mi cuenta para poder anotarte.",
    pareja_sin_categoria: `${partner} todavía no cargó su categoría en Mi cuenta.`,
    categoria_fuera_de_rango: `Tu categoría no entra en este torneo${rules}.`,
    pareja_fuera_de_rango: `La categoría de ${partner} no entra en este torneo${rules}.`,
    suma_insuficiente: `Entre los dos no llegan a la suma del torneo${rules}.`,
    ya_inscripto:
      "Ya tenés una inscripción en este torneo. Cancelala para anotarte con otra pareja.",
    pareja_ya_inscripta: `${partner} ya está anotado en este torneo con otra pareja.`,
    cupo_completo:
      "Se completó el cupo. Si se libera un lugar, vas a poder anotarte.",
    invitacion_no_encontrada: "Esta invitación ya no está disponible.",
    inscripcion_no_encontrada: "Esta inscripción ya no está disponible.",
  };
  return messages[code] ?? "No pudimos guardar los cambios. Probá de nuevo.";
}

function revalidateRegistration(slug: string) {
  revalidatePath(`/torneos/${slug}`);
  revalidatePath("/torneos");
  revalidatePath("/mi-cuenta");
  revalidatePath("/");
}

/** Se anota e invita a la pareja por su usuario. Queda "esperando a la pareja". */
export async function registerForTournament(
  slug: string,
  _prevState: RegistrationFormState,
  formData: FormData,
): Promise<RegistrationFormState> {
  const values = {
    partner_username: field(formData, "partner_username")
      .replace(/^@/, "")
      .toLowerCase(),
    contact_phone: field(formData, "contact_phone"),
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
  if (!values.partner_username) {
    errors.partner_username = "Buscá a tu pareja y elegila de la lista.";
  }
  const digits = values.contact_phone.replace(/\D/g, "");
  if (digits.length < 8 || values.contact_phone.length > 30) {
    errors.contact_phone = "Poné un teléfono válido, con característica.";
  }
  if (values.notes.length > 500) {
    errors.notes = "Las observaciones pueden tener hasta 500 caracteres.";
  }
  if (Object.keys(errors).length > 0) return { errors, values };

  const tournament = await getTournament(slug);
  if (!tournament || tournament.status !== "inscripciones") {
    return {
      message: "Las inscripciones para este torneo están cerradas.",
      values,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("register_pair", {
    p_tournament_id: tournament.id,
    p_partner_username: values.partner_username,
    p_contact_phone: values.contact_phone,
    p_notes: values.notes,
  });
  if (error) {
    if (error.code !== "P0001") console.error("[inscripción]", error);
    const message = registrationErrorMessage(error.message, {
      rules: categoryRulesLabel(tournament),
      partner: `@${values.partner_username}`,
    });
    return error.message === "pareja_no_existe"
      ? { errors: { partner_username: message }, values }
      : { message, values };
  }

  revalidateRegistration(slug);
  return {};
}

export type PartnerOption = {
  username: string;
  name: string;
  avatarUrl: string | null;
  category: string | null;
  /** Por qué no puede jugar con vos este torneo (null si puede). */
  blocked: string | null;
};

/** Busca jugadores por usuario o nombre y marca los que no cumplen la categoría. */
export async function searchPartners(
  slug: string,
  query: string,
): Promise<PartnerOption[]> {
  const term = query.trim().replace(/^@/, "");
  if (term.length < 2 || term.length > 60) return [];
  const user = await getCurrentUser();
  if (!user) return [];

  const [tournament, profile] = await Promise.all([
    getTournament(slug),
    getMyProfile(),
  ]);
  if (!tournament) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_profiles", {
    p_query: term,
  });
  if (error) {
    console.error("[buscar pareja]", error);
    return [];
  }

  return data.map((candidate) => {
    const name = candidate.full_name || `@${candidate.username}`;
    const blocked = pairCategoryError(
      tournament,
      profile?.category ?? null,
      candidate.category,
      name,
    );
    return {
      username: candidate.username,
      name,
      avatarUrl: safeAvatarUrl(candidate.avatar_url),
      category: candidate.category ? categoryName(candidate.category) : null,
      // Si el problema es la propia categoría, lo muestra el formulario, no cada persona.
      blocked:
        blocked && candidate.category && profile?.category ? blocked : null,
    };
  });
}

/** La pareja invitada acepta o rechaza. */
export async function respondInvitation(
  registrationId: number,
  accept: boolean,
  slug: string,
): Promise<{ message?: string }> {
  const user = await getCurrentUser();
  if (!user) return { message: "Tu sesión expiró. Ingresá de nuevo." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_invitation", {
    p_registration_id: registrationId,
    p_accept: accept,
  });
  if (error) {
    if (error.code !== "P0001") console.error("[invitación]", error);
    const tournament = await getTournament(slug);
    return {
      message: registrationErrorMessage(error.message, {
        rules: tournament ? categoryRulesLabel(tournament) : null,
        partner: "Quien te invitó",
      }),
    };
  }

  revalidateRegistration(slug);
  return {};
}

/** Cancela la inscripción (o retira la invitación) y avisa al otro jugador. */
export async function cancelRegistration(
  registrationId: number,
  slug: string,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_registration", {
    p_registration_id: registrationId,
  });
  if (error) {
    console.error("[cancelar inscripción]", error);
    throw new Error(registrationErrorMessage(error.message));
  }

  revalidateRegistration(slug);
}
