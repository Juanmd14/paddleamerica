"use client";

import { useState } from "react";
import { Field, fieldProps } from "@/components/admin/admin-ui";
import { ImageUpload } from "@/components/admin/image-upload";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { SubmitButton } from "@/components/submit-button";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import type { FormState } from "@/lib/admin-form";
import { tournamentGenderOptions, tournamentStatusOptions } from "@/lib/labels";
import { slugify } from "@/lib/utils";
import type { Tournament } from "@/types/models";

type TournamentFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  tournament?: Tournament;
  submitLabel: string;
};

export function TournamentForm({
  action,
  tournament,
  submitLabel,
}: TournamentFormProps) {
  const { state, errors, pending, onSubmit } = useAdminForm(action);

  // El slug se completa solo con el nombre y el año hasta que lo edites a mano.
  const [name, setName] = useState(tournament?.name ?? "");
  const [startsOn, setStartsOn] = useState(tournament?.starts_on ?? "");
  const [slug, setSlug] = useState(tournament?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(tournament));
  const suggestedSlug = slugify(`${name} ${startsOn.slice(0, 4)}`);

  // Vista previa del mapa: se actualiza al salir de dirección, sede o ciudad.
  const placeOf = (
    address?: string | null,
    venue?: string | null,
    city?: string | null,
  ) =>
    address?.trim() || [venue, city].filter((part) => part?.trim()).join(", ");
  const [mapQuery, setMapQuery] = useState(() =>
    placeOf(tournament?.address, tournament?.venue, tournament?.city),
  );
  function refreshMap(form: HTMLFormElement | null) {
    if (!form) return;
    const data = new FormData(form);
    setMapQuery(
      placeOf(
        String(data.get("address") ?? ""),
        String(data.get("venue") ?? ""),
        String(data.get("city") ?? ""),
      ),
    );
  }

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
              required
            />
          </Field>
          <Field
            name="slug"
            label="Dirección"
            error={errors.slug}
            hint={`/torneos/${slugTouched ? slug || "…" : suggestedSlug || "…"}`}
            className="sm:col-span-2"
          >
            <Input
              {...fieldProps("slug", errors.slug)}
              value={slugTouched ? slug : suggestedSlug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
            />
          </Field>
          <Field name="starts_on" label="Empieza" error={errors.starts_on}>
            <Input
              {...fieldProps("starts_on", errors.starts_on)}
              type="date"
              value={startsOn}
              onChange={(event) => setStartsOn(event.target.value)}
              required
            />
          </Field>
          <Field name="ends_on" label="Termina" error={errors.ends_on}>
            <Input
              {...fieldProps("ends_on", errors.ends_on)}
              type="date"
              defaultValue={tournament?.ends_on}
              required
            />
          </Field>
          <Field name="city" label="Ciudad" error={errors.city}>
            <Input
              {...fieldProps("city", errors.city)}
              defaultValue={tournament?.city}
              onBlur={(event) => refreshMap(event.currentTarget.form)}
              required
            />
          </Field>
          <Field name="venue" label="Sede o club" optional error={errors.venue}>
            <Input
              {...fieldProps("venue", errors.venue)}
              defaultValue={tournament?.venue ?? ""}
              onBlur={(event) => refreshMap(event.currentTarget.form)}
            />
          </Field>
          <Field
            name="category"
            label="Categoría"
            error={errors.category}
            hint="Ej. 1ra y 2da, 3ra a 5ta, Suma 13"
          >
            <Input
              {...fieldProps("category", errors.category)}
              defaultValue={tournament?.category}
              required
            />
          </Field>
          <Field name="gender" label="Rama" error={errors.gender}>
            <Select
              {...fieldProps("gender", errors.gender)}
              defaultValue={tournament?.gender ?? "masculino"}
            >
              {tournamentGenderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            name="description"
            label="Descripción"
            optional
            className="sm:col-span-2"
            hint="Dejá una línea en blanco entre párrafos."
          >
            <Textarea
              {...fieldProps("description")}
              rows={7}
              defaultValue={tournament?.description ?? ""}
            />
          </Field>
          <Field name="prize" label="Premios" optional>
            <Input
              {...fieldProps("prize")}
              defaultValue={tournament?.prize ?? ""}
            />
          </Field>
          <Field
            name="champions"
            label="Campeones"
            optional
            hint="Cuando termine. Ej. Gómez / Ibarra"
          >
            <Input
              {...fieldProps("champions")}
              defaultValue={tournament?.champions ?? ""}
            />
          </Field>
        </Card>

        <Card className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div className="sm:col-span-2">
            <h2 className="font-display text-2xl font-bold uppercase">
              Ubicación
            </h2>
            <p className="text-sm text-muted-foreground">
              Se muestra en un mapa con el botón “Cómo llegar”.
            </p>
          </div>
          <Field
            name="address"
            label="Dirección"
            optional
            error={errors.address}
            hint="Ej. Av. Rivadavia 1234, América. Si la dejás vacía, se usa la sede y la ciudad."
          >
            <Input
              {...fieldProps("address", errors.address)}
              defaultValue={tournament?.address ?? ""}
              onBlur={(event) => refreshMap(event.currentTarget.form)}
              autoComplete="off"
            />
          </Field>
          <Field
            name="maps_url"
            label="Link de Google Maps"
            optional
            error={errors.maps_url}
            hint="En Google Maps: Compartir → Copiar vínculo. Lo usa “Cómo llegar”."
          >
            <Input
              {...fieldProps("maps_url", errors.maps_url)}
              type="url"
              inputMode="url"
              placeholder="https://maps.app.goo.gl/…"
              defaultValue={tournament?.maps_url ?? ""}
            />
          </Field>
          {mapQuery && (
            <div className="overflow-hidden rounded-lg border border-border sm:col-span-2">
              <iframe
                key={mapQuery}
                title="Vista previa del mapa"
                src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                loading="lazy"
                className="aspect-[16/7] w-full border-0"
              />
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="space-y-5 p-5 sm:p-6">
          <Field
            name="status"
            label="Estado"
            error={errors.status}
            hint="Con “Inscripciones abiertas” aparece el formulario para anotarse."
          >
            <Select
              {...fieldProps("status", errors.status)}
              defaultValue={tournament?.status ?? "proximo"}
            >
              {tournamentStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            name="capacity"
            label="Cupo (parejas)"
            optional
            error={errors.capacity}
            hint="Al llenarse se cierran las inscripciones. Vacío = sin límite."
          >
            <Input
              {...fieldProps("capacity", errors.capacity)}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              defaultValue={tournament?.capacity ?? ""}
            />
          </Field>
          <Field
            name="registration_opens_on"
            label="Abren las inscripciones"
            optional
            error={errors.registration_opens_on}
            hint="Se muestra como “Abre el …” mientras esté en Próximamente."
          >
            <Input
              {...fieldProps(
                "registration_opens_on",
                errors.registration_opens_on,
              )}
              type="date"
              defaultValue={tournament?.registration_opens_on ?? ""}
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
            label="Flyer"
            folder="flyers"
            ratio="flyer"
            defaultValue={tournament?.cover_url}
            hint="Ideal 1080 × 1350 (formato Instagram)"
          />
          {errors.cover_url && (
            <p className="mt-1.5 text-sm text-danger">{errors.cover_url}</p>
          )}
        </Card>
      </div>
    </form>
  );
}
