"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { emailAccounts } from "@/lib/account-emails";
import { getCurrentUser, safeAvatarUrl } from "@/lib/auth";
import {
  categoryName,
  categoryRulesLabel,
  pairCategoryError,
} from "@/lib/categories";
import { getMyProfile, getTournament } from "@/lib/data";
import { isEmailConfigured } from "@/lib/email";
import { formatDateRange } from "@/lib/format";
import { genderErrorMessage, pairGenderError } from "@/lib/gender-rules";
import { genderLabel } from "@/lib/labels";
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
  context: {
    rules?: string | null;
    partner?: string;
    tournamentGender?: string;
  } = {},
) {
  const partner = context.partner || "Tu pareja";
  const genderMessage = context.tournamentGender
    ? genderErrorMessage(code, context.tournamentGender, partner)
    : null;
  if (genderMessage) return genderMessage;
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
    falta_categoria:
      "Todavía no tenés categoría. La asigna el organizador: hasta entonces no podés anotarte.",
    pareja_sin_categoria: `${partner} todavía no tiene categoría asignada por el organizador.`,
    categoria_fuera_de_rango: `Tu categoría no entra en este torneo${rules}.`,
    pareja_fuera_de_rango: `La categoría de ${partner} no entra en este torneo${rules}.`,
    suma_insuficiente: `Entre los dos no llegan a la suma del torneo${rules}.`,
    ya_inscripto:
      "Ya tenés una inscripción en este torneo. Cancelala para anotarte con otra pareja.",
    inscripcion_rechazada:
      "El organizador rechazó tu inscripción en este torneo. Si fue un error, pedile que la libere.",
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
  const { data: registrationId, error } = await supabase.rpc("register_pair", {
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
      tournamentGender: tournament.gender,
    });
    return error.message === "pareja_no_existe"
      ? { errors: { partner_username: message }, values }
      : { message, values };
  }

  if (isEmailConfigured()) {
    const { data: created } = await supabase
      .from("tournament_registrations")
      .select("partner_id")
      .eq("id", registrationId)
      .maybeSingle();
    const dates = formatDateRange(tournament.starts_on, tournament.ends_on);
    after(() =>
      emailAccounts([created?.partner_id], {
        subject: `${user.name} te invitó a jugar el ${tournament.name}`,
        paragraphs: [
          `${user.name} te invitó a jugar el ${tournament.name} (${dates}, ${tournament.city}).`,
          "Aceptá la invitación para quedar anotados. Después el organizador confirma el lugar.",
        ],
        button: {
          label: "Ver la invitación",
          path: `/torneos/${slug}#inscripcion`,
        },
      }),
    );
  }

  // Si todavía no tenía teléfono en su cuenta, queda guardado el de la inscripción.
  await supabase
    .from("profiles")
    .update({ phone: values.contact_phone })
    .eq("id", user.id)
    .is("phone", null);

  revalidateRegistration(slug);
  return {};
}

export type PartnerOption = {
  username: string;
  name: string;
  avatarUrl: string | null;
  category: string | null;
  /** Rama ("Masculino"/"Femenino") o null si no la eligió. */
  gender: string | null;
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
    // La rama se controla solo si la propia ya está: si falta, lo avisa el formulario.
    const genderBlocked = profile?.gender
      ? pairGenderError(
          tournament.gender,
          profile.gender,
          candidate.gender,
          name,
        )
      : null;
    return {
      username: candidate.username,
      name,
      avatarUrl: safeAvatarUrl(candidate.avatar_url),
      category: candidate.category ? categoryName(candidate.category) : null,
      gender: candidate.gender ? genderLabel(candidate.gender) : null,
      // Si el problema es la propia categoría, lo muestra el formulario, no cada persona.
      blocked:
        (blocked && candidate.category && profile?.category ? blocked : null) ??
        genderBlocked,
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
  // Para el email: después de rechazar, la inscripción ya no existe.
  const { data: invitation } = isEmailConfigured()
    ? await supabase
        .from("tournament_registrations")
        .select("user_id, tournament:tournaments(name, slug)")
        .eq("id", registrationId)
        .maybeSingle()
    : { data: null };

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
        tournamentGender: tournament?.gender,
      }),
    };
  }

  if (invitation) {
    const { name } = invitation.tournament;
    after(() =>
      emailAccounts([invitation.user_id], {
        subject: accept
          ? `${user.name} aceptó jugar el ${name}`
          : `${user.name} no aceptó jugar el ${name}`,
        paragraphs: [
          accept
            ? "Ya están anotados. Falta que el organizador confirme el lugar."
            : "Podés invitar a otra pareja mientras sigan abiertas las inscripciones.",
        ],
        button: {
          label: "Ver el torneo",
          path: `/torneos/${invitation.tournament.slug}#inscripcion`,
        },
      }),
    );
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
  const { data: registration } = isEmailConfigured()
    ? await supabase
        .from("tournament_registrations")
        .select(
          "user_id, partner_id, status, tournament:tournaments(name, slug)",
        )
        .eq("id", registrationId)
        .maybeSingle()
    : { data: null };

  const { error } = await supabase.rpc("cancel_registration", {
    p_registration_id: registrationId,
  });
  if (error) {
    console.error("[cancelar inscripción]", error);
    throw new Error(registrationErrorMessage(error.message));
  }

  if (registration) {
    const other =
      registration.user_id === user.id
        ? registration.partner_id
        : registration.user_id;
    const { name } = registration.tournament;
    after(() =>
      emailAccounts([other], {
        subject:
          registration.status === "invitacion"
            ? `${user.name} retiró la invitación al ${name}`
            : `${user.name} canceló la inscripción al ${name}`,
        paragraphs: [
          "Si querés jugarlo, podés anotarte con otra pareja mientras sigan abiertas las inscripciones.",
        ],
        button: {
          label: "Ver el torneo",
          path: `/torneos/${registration.tournament.slug}#inscripcion`,
        },
      }),
    );
  }

  revalidateRegistration(slug);
}
