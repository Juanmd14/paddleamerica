"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type FormState, text } from "@/lib/admin-form";
import { requireAdmin } from "@/lib/auth";
import { isCategoryNumber } from "@/lib/categories";
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
