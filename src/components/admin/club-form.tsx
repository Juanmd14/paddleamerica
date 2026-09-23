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
import { slugify } from "@/lib/utils";
import type { Club } from "@/types/models";

type ClubFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  club?: Club;
  submitLabel: string;
};

export function ClubForm({ action, club, submitLabel }: ClubFormProps) {
  const { state, errors, pending, onSubmit } = useAdminForm(action);

  const [name, setName] = useState(club?.name ?? "");
  const [slug, setSlug] = useState(club?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(club));
  const currentSlug = slugTouched ? slug : slugify(name);

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {state.message && <Alert tone="danger">{state.message}</Alert>}
        {state.ok && <Alert tone="success">Guardamos los cambios.</Alert>}

        <Card className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <Field
            name="name"
            label="Nombre"
            error={errors.name}
            className="sm:col-span-2"
          >
            <Input
              {...fieldProps("name", errors.name)}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Complejo El Remate"
              required
            />
          </Field>
          <Field
            name="slug"
            label="Link del club"
            error={errors.slug}
            hint={`/clubes/${currentSlug || "…"}`}
            className="sm:col-span-2"
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
          <Field name="city" label="Ciudad" error={errors.city}>
            <Input
              {...fieldProps("city", errors.city)}
              defaultValue={club?.city ?? ""}
              required
            />
          </Field>
          <Field name="courts" label="Canchas" optional error={errors.courts}>
            <Input
              {...fieldProps("courts", errors.courts)}
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              defaultValue={club?.courts ?? ""}
            />
          </Field>
          <Field
            name="address"
            label="Dirección"
            optional
            error={errors.address}
            hint="Ej. Av. Rivadavia 1234, América. Se usa para el mapa."
            className="sm:col-span-2"
          >
            <Input
              {...fieldProps("address", errors.address)}
              defaultValue={club?.address ?? ""}
              autoComplete="off"
            />
          </Field>
          <Field
            name="maps_url"
            label="Link de Google Maps"
            optional
            error={errors.maps_url}
            hint="En Google Maps: Compartir → Copiar vínculo. Lo usa “Cómo llegar”."
            className="sm:col-span-2"
          >
            <Input
              {...fieldProps("maps_url", errors.maps_url)}
              type="url"
              inputMode="url"
              placeholder="https://maps.app.goo.gl/…"
              defaultValue={club?.maps_url ?? ""}
            />
          </Field>
          <Field
            name="description"
            label="Sobre el club"
            optional
            error={errors.description}
            hint="Qué tiene: tipo de canchas, techadas o no, vestuarios, buffet… Dejá una línea en blanco entre párrafos."
            className="sm:col-span-2"
          >
            <Textarea
              {...fieldProps("description", errors.description)}
              rows={6}
              maxLength={2000}
              defaultValue={club?.description ?? ""}
            />
          </Field>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="space-y-5 p-5 sm:p-6">
          <Field
            name="phone"
            label="Teléfono del club"
            optional
            error={errors.phone}
            hint="Ej. 2392 123456. Solo para el panel: no se muestra en el sitio."
          >
            <Input
              {...fieldProps("phone", errors.phone)}
              type="tel"
              inputMode="tel"
              defaultValue={club?.phone ?? ""}
            />
          </Field>
          <Field
            name="instagram"
            label="Instagram"
            optional
            error={errors.instagram}
            hint="Solo el usuario, sin @."
          >
            <Input
              {...fieldProps("instagram", errors.instagram)}
              defaultValue={club?.instagram ?? ""}
              autoCapitalize="none"
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
            label="Foto del club"
            folder="clubes"
            ratio="video"
            defaultValue={club?.cover_url}
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
