"use server";

import { revalidatePath } from "next/cache";
import {
  type FormState,
  isStorageUrl,
  optionalText,
  text,
  wholeNumber,
} from "@/lib/admin-form";
import { requireAdmin } from "@/lib/auth";
import { STAT_KEYS, type StatKey, type StatSetting } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

export async function updateSiteSettings(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const errors: Record<string, string> = {};

  const heroImageUrl = optionalText(formData, "hero_image_url");
  if (!isStorageUrl(heroImageUrl)) {
    errors.hero_image_url = "Subí la foto desde acá.";
  }

  const stats: StatSetting[] = [];
  for (let index = 0; index < 4; index++) {
    const key = text(formData, `stat_${index}_key`);
    if (!key) continue;
    if (!STAT_KEYS.includes(key as StatKey)) {
      errors[`stat_${index}_key`] = "Elegí qué mostrar.";
      continue;
    }
    const label = optionalText(formData, `stat_${index}_label`);
    if (label && label.length > 40) {
      errors[`stat_${index}_label`] = "Hasta 40 caracteres.";
    }
    const rawValue = text(formData, `stat_${index}_value`);
    const value = rawValue
      ? wholeNumber(formData, `stat_${index}_value`)
      : null;
    if (value !== null && Number.isNaN(value)) {
      errors[`stat_${index}_value`] = "Tiene que ser un número entero.";
    }
    stats.push({ key: key as StatKey, label, value });
  }
  if (stats.length === 0) {
    errors.stat_0_key = "Elegí al menos un número para mostrar.";
  }
  if (Object.keys(errors).length > 0) return { errors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ hero_image_url: heroImageUrl, stats })
    .eq("id", true);
  if (error) {
    console.error("[sitio]", error);
    return { message: "No pudimos guardar los cambios. Probá de nuevo." };
  }

  revalidatePath("/");
  revalidatePath("/admin/sitio");
  return { ok: true };
}
