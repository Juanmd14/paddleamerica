"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  type FormState,
  isStorageUrl,
  optionalText,
  SLUG_PATTERN,
  saveErrorMessage,
  text,
} from "@/lib/admin-form";
import { requireAdmin } from "@/lib/auth";
import { fromDateTimeLocal } from "@/lib/format";
import { MAX_CAPTION, MAX_NEWS_PHOTOS } from "@/lib/news-photos";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { TablesInsert } from "@/types/database.types";

/** Las fotos de la nota, en el orden en que quedaron en el formulario. */
function readPhotos(formData: FormData) {
  const urls = formData.getAll("photo_url").map(String);
  const captions = formData.getAll("photo_caption").map(String);
  return urls.slice(0, MAX_NEWS_PHOTOS).map((url, index) => ({
    url,
    caption: captions[index]?.trim().slice(0, MAX_CAPTION) || null,
  }));
}

function readArticle(formData: FormData) {
  const title = text(formData, "title");
  const publishedAt = fromDateTimeLocal(text(formData, "published_at"));
  const photos = readPhotos(formData);
  const values: TablesInsert<"news"> = {
    title,
    slug: text(formData, "slug") || slugify(title),
    excerpt: optionalText(formData, "excerpt"),
    body: text(formData, "body"),
    tag: optionalText(formData, "tag"),
    author: optionalText(formData, "author"),
    cover_url: optionalText(formData, "cover_url"),
    photos,
    is_published: formData.get("is_published") === "on",
    published_at: publishedAt ?? new Date().toISOString(),
  };

  const errors: Record<string, string> = {};
  if (title.length < 5 || title.length > 160) {
    errors.title = "Poné un título (5 a 160 caracteres).";
  }
  if (!SLUG_PATTERN.test(values.slug)) {
    errors.slug = "Solo minúsculas, números y guiones.";
  }
  if ((values.excerpt ?? "").length > 300) {
    errors.excerpt = "La bajada puede tener hasta 300 caracteres.";
  }
  if (values.body.length < 20) errors.body = "Escribí el texto de la noticia.";
  if (!publishedAt) errors.published_at = "Elegí fecha y hora de publicación.";
  if (!isStorageUrl(values.cover_url ?? null)) {
    errors.cover_url = "Subí la portada desde acá.";
  }
  if (photos.some((photo) => !isStorageUrl(photo.url))) {
    errors.photos = "Subí las fotos desde acá.";
  }

  return { values, errors };
}

function revalidateNewsPages(...slugs: string[]) {
  for (const path of [
    "/",
    "/noticias",
    "/admin/noticias",
    "/admin",
    "/sitemap.xml",
  ]) {
    revalidatePath(path);
  }
  for (const slug of new Set(slugs)) revalidatePath(`/noticias/${slug}`);
}

export async function createArticle(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const { values, errors } = readArticle(formData);
  if (Object.keys(errors).length > 0) return { errors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news")
    .insert(values)
    .select("id")
    .single();
  if (error) {
    return error.code === "23505"
      ? { errors: { slug: "Ya hay una noticia con ese slug." } }
      : { message: saveErrorMessage(error) };
  }

  revalidateNewsPages(values.slug);
  redirect(`/admin/noticias/${data.id}?guardado=1`);
}

export async function updateArticle(
  id: number,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const { values, errors } = readArticle(formData);
  if (Object.keys(errors).length > 0) return { errors };

  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("news")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("news").update(values).eq("id", id);
  if (error) {
    return error.code === "23505"
      ? { errors: { slug: "Ya hay una noticia con ese slug." } }
      : { message: saveErrorMessage(error) };
  }

  revalidateNewsPages(values.slug, previous?.slug ?? values.slug);
  revalidatePath(`/admin/noticias/${id}`);
  return { ok: true };
}

export async function deleteArticle(id: number): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: article } = await supabase
    .from("news")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) {
    redirect(
      `/admin/noticias/${id}?error=${encodeURIComponent(saveErrorMessage(error))}`,
    );
  }

  revalidateNewsPages(article?.slug ?? "");
  redirect("/admin/noticias?borrado=1");
}
