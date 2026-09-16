"use server";

import { revalidatePath } from "next/cache";
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
