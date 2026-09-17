"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { emailProfiles } from "@/lib/account-emails";
import { redirect } from "next/navigation";
import { type FormState, text } from "@/lib/admin-form";
import { requireAdmin } from "@/lib/auth";
import { categoryName, isCategoryNumber } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";

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
  const { data: before } = await supabase
    .from("profiles")
    .select("category, email, full_name")
    .eq("id", userId)
    .maybeSingle();

  const { error } = await supabase.rpc("set_profile_category", {
    p_user_id: userId,
    p_category: category,
  });
  if (error) {
    return {
      message:
        error.message === "usuario_no_existe"
          ? "Esta cuenta ya no existe."
          : error.message === "cuenta_vinculada"
            ? "Esta cuenta está vinculada al ranking: cambiá la categoría en la ficha del jugador."
            : "No pudimos guardar la categoría. Probá de nuevo.",
    };
  }

  if (before && category && before.category !== category) {
    after(() =>
      emailProfiles([before], {
        subject: `Tu categoría es ${categoryName(category)}`,
        paragraphs: [
          "La asignó el organizador. Ya podés anotarte en los torneos de tu categoría.",
        ],
        button: { label: "Ver torneos", path: "/torneos" },
      }),
    );
  }

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);
  return { ok: true };
}

/** Asigna, corrige o quita (con "") la rama de una cuenta. Le avisa al jugador. */
export async function setProfileGender(
  userId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const value = text(formData, "gender");
  if (value && value !== "masculino" && value !== "femenino") {
    return { message: "Elegí una rama." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_profile_gender", {
    p_user_id: userId,
    p_gender: value || undefined,
  });
  if (error) {
    return {
      message:
        error.message === "usuario_no_existe"
          ? "Esta cuenta ya no existe."
          : error.message === "cuenta_vinculada"
            ? "Esta cuenta está vinculada al ranking: cambiá la rama en la ficha del jugador."
            : "No pudimos guardar la rama. Probá de nuevo.",
    };
  }

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);
  return { ok: true };
}

const LINK_ERRORS: Record<string, string> = {
  usuario_no_existe: "Esta cuenta ya no existe.",
  jugador_no_existe: "Ese jugador ya no está en el ranking.",
  jugador_ya_vinculado: "Ese jugador ya está vinculado a otra cuenta.",
  categoria_del_jugador_invalida:
    "La categoría del jugador no es de 1ra a 8va: corregila en su ficha y probá de nuevo.",
};

/**
 * Vincula la cuenta con un jugador del ranking (o la desvincula, con null).
 * Desde ahí la categoría y la rama de la cuenta salen del jugador.
 */
export async function linkProfilePlayer(
  userId: string,
  playerId: number | null,
): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("link_profile_player", {
    p_user_id: userId,
    p_player_id: playerId ?? undefined,
  });
  if (error) {
    const message =
      LINK_ERRORS[error.message] ??
      (error.code === "23505"
        ? LINK_ERRORS.jugador_ya_vinculado
        : "No pudimos vincular la cuenta. Probá de nuevo.");
    redirect(`/admin/usuarios/${userId}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);
  revalidatePath("/admin/jugadores/[id]", "page");
  revalidatePath("/jugadores/[slug]", "page");
  revalidatePath("/mi-cuenta");
  redirect(`/admin/usuarios/${userId}?vinculo=${playerId ? 1 : 0}`);
}

const ADMIN_ERRORS: Record<string, string> = {
  es_tu_cuenta:
    "No podés quitarte el admin a vos mismo: pedíselo a otro admin.",
  ultimo_admin: "Tiene que quedar al menos un admin.",
  usuario_no_existe: "Esta cuenta ya no existe.",
};

/** Hace admin (o le quita el admin) a una cuenta. La base no deja quitarse el propio ni dejar el sitio sin admins. */
export async function setProfileAdmin(
  userId: string,
  makeAdmin: boolean,
): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: account } = makeAdmin
    ? await supabase
        .from("profiles")
        .select("email, full_name, is_admin")
        .eq("id", userId)
        .maybeSingle()
    : { data: null };

  const { error } = await supabase.rpc("set_profile_admin", {
    p_user_id: userId,
    p_is_admin: makeAdmin,
  });
  if (error) {
    const message =
      ADMIN_ERRORS[error.message] ??
      "No pudimos cambiar el permiso. Probá de nuevo.";
    redirect(`/admin/usuarios/${userId}?error=${encodeURIComponent(message)}`);
  }

  if (account && !account.is_admin) {
    after(() =>
      emailProfiles([account], {
        subject: "Ahora sos admin de PaddleAmerica",
        paragraphs: [
          "Tenés acceso al panel: torneos, jugadores, usuarios y puntos.",
        ],
        button: { label: "Abrir el panel", path: "/admin" },
      }),
    );
  }

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);
  redirect(`/admin/usuarios/${userId}?admin=${makeAdmin ? 1 : 0}`);
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
