"use client";

import { useState } from "react";
import { Field, fieldProps } from "@/components/admin/admin-ui";
import { ImageUpload } from "@/components/admin/image-upload";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { SubmitButton } from "@/components/submit-button";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import type { FormState } from "@/lib/admin-form";
import { siteConfig } from "@/lib/site";
import { slugify } from "@/lib/utils";
import type { NewsArticle } from "@/types/models";

type NewsFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  article?: NewsArticle;
  /** "YYYY-MM-DDTHH:mm" en hora argentina; se calcula en el servidor para evitar diferencias al hidratar. */
  defaultPublishedAt: string;
  submitLabel: string;
};

export function NewsForm({
  action,
  article,
  defaultPublishedAt,
  submitLabel,
}: NewsFormProps) {
  const { state, errors, pending, onSubmit } = useAdminForm(action);

  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(article));
  const [body, setBody] = useState(article?.body ?? "");
  const [published, setPublished] = useState(article?.is_published ?? true);
  const currentSlug = slugTouched ? slug : slugify(title);

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {state.message && <Alert tone="danger">{state.message}</Alert>}
        {state.ok && <Alert tone="success">Guardamos los cambios.</Alert>}

        <Card className="space-y-5 p-5 sm:p-6">
          <Field name="title" label="Título" error={errors.title}>
            <Input
              {...fieldProps("title", errors.title)}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </Field>
          <Field
            name="slug"
            label="Dirección"
            error={errors.slug}
            hint={`/noticias/${currentSlug || "…"}`}
          >
            <Input
              {...fieldProps("slug", errors.slug)}
              value={currentSlug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
            />
          </Field>
          <Field
            name="excerpt"
            label="Bajada"
            optional
            error={errors.excerpt}
            hint="Una o dos oraciones que resumen la nota. Se ve en las tarjetas."
          >
            <Textarea
              {...fieldProps("excerpt", errors.excerpt)}
              rows={2}
              maxLength={300}
              defaultValue={article?.excerpt ?? ""}
            />
          </Field>
          <Field
            name="body"
            label="Texto"
            error={errors.body}
            hint={`Dejá una línea en blanco entre párrafos · ${body.length} caracteres`}
          >
            <Textarea
              {...fieldProps("body", errors.body)}
              rows={14}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
            />
          </Field>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="space-y-5 p-5 sm:p-6">
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              name="is_published"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
              className="size-5 accent-noche-950"
            />
            Publicada
          </label>
          <Field
            name="published_at"
            label="Fecha de publicación"
            error={errors.published_at}
            hint={
              published
                ? "Si elegís una fecha futura, aparece recién ese día (hora argentina)."
                : "Mientras no esté publicada es un borrador: solo la ven los admins."
            }
          >
            <Input
              {...fieldProps("published_at", errors.published_at)}
              type="datetime-local"
              defaultValue={defaultPublishedAt}
              required
            />
          </Field>
          <Field
            name="tag"
            label="Etiqueta"
            optional
            hint="Ej. Torneos, Ranking, Clubes"
          >
            <Input {...fieldProps("tag")} defaultValue={article?.tag ?? ""} />
          </Field>
          <Field name="author" label="Autor" optional>
            <Input
              {...fieldProps("author")}
              defaultValue={article?.author ?? `Redacción ${siteConfig.name}`}
            />
          </Field>
          <SubmitButton
            className="w-full"
            pending={pending}
            pendingLabel="Guardando…"
          >
            {submitLabel}
          </SubmitButton>
        </Card>
        <Card className="p-5 sm:p-6">
          <ImageUpload
            name="cover_url"
            label="Portada"
            folder="noticias"
            ratio="video"
            defaultValue={article?.cover_url}
            hint="Horizontal, ideal 1600 × 900"
          />
          {errors.cover_url && (
            <p className="mt-1.5 text-sm text-danger">{errors.cover_url}</p>
          )}
        </Card>
      </div>
    </form>
  );
}
