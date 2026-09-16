"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = {
  ok?: boolean;
  message?: string;
  errors?: Partial<Record<"full_name" | "phone", string>>;
};

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Tu sesión expiró. Ingresá de nuevo." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const errors: ProfileFormState["errors"] = {};
  if (fullName.length < 3 || fullName.length > 120) {
    errors.full_name = "Escribí tu nombre y apellido.";
  }
  if (phone && (phone.replace(/\D/g, "").length < 8 || phone.length > 30)) {
    errors.phone = "Poné un teléfono válido, con característica.";
  }
  if (Object.keys(errors).length > 0) return { errors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: phone || null })
    .eq("id", user.id);
  if (error) {
    return { message: "No pudimos guardar los cambios. Probá de nuevo." };
  }

  // El nombre del header sale de los metadatos de la sesión.
  await supabase.auth.updateUser({ data: { full_name: fullName } });

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Marca como leídos los avisos del usuario (se llama al mostrarlos en Mi cuenta). */
export async function markNotificationsRead(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (error) console.error("[avisos]", error);
}
