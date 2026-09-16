"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { isCategoryNumber } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = {
  ok?: boolean;
  message?: string;
  errors?: Partial<
    Record<"full_name" | "phone" | "username" | "category", string>
  >;
};

// Igual que profiles_username_format en la base.
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_.]{2,19}$/;

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Tu sesión expiró. Ingresá de nuevo." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const username = String(formData.get("username") ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
  const categoryValue = String(formData.get("category") ?? "");
  const category = categoryValue ? Number(categoryValue) : null;

  const errors: ProfileFormState["errors"] = {};
  if (fullName.length < 3 || fullName.length > 120) {
    errors.full_name = "Escribí tu nombre y apellido.";
  }
  if (phone && (phone.replace(/\D/g, "").length < 8 || phone.length > 30)) {
    errors.phone = "Poné un teléfono válido, con característica.";
  }
  if (!USERNAME_PATTERN.test(username)) {
    errors.username =
      "De 3 a 20 letras o números, sin espacios (podés usar punto y guion bajo).";
  }
  if (category !== null && !isCategoryNumber(category)) {
    errors.category = "Elegí tu categoría.";
  }
  if (Object.keys(errors).length > 0) return { errors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: phone || null, username, category })
    .eq("id", user.id);
  if (error) {
    if (error.code === "23505") {
      return { errors: { username: "Ese usuario ya lo tiene otra persona." } };
    }
    return { message: "No pudimos guardar los cambios. Probá de nuevo." };
  }

  // El nombre del header sale de los metadatos de la sesión.
  await supabase.auth.updateUser({ data: { full_name: fullName } });

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Guarda (o quita, con null) la foto de perfil y borra la anterior del Storage. */
export async function updateAvatar(
  url: string | null,
): Promise<{ message?: string }> {
  const user = await getCurrentUser();
  if (!user) return { message: "Tu sesión expiró. Ingresá de nuevo." };

  const folder = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/perfiles/${user.id}/`;
  if (url !== null && !url.startsWith(folder)) {
    return { message: "Subí la foto desde acá." };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);
  if (error) return { message: "No pudimos guardar la foto. Probá de nuevo." };

  const previous = profile?.avatar_url;
  if (previous?.startsWith(folder) && previous !== url) {
    const { error: removeError } = await supabase.storage
      .from("media")
      .remove([previous.slice(previous.indexOf("perfiles/"))]);
    if (removeError) console.error("[foto de perfil]", removeError);
  }

  revalidatePath("/", "layout");
  return {};
}

/** Marca como leídos los avisos del usuario. */
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
