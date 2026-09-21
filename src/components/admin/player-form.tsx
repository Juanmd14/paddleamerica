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
import { categoryOptions } from "@/lib/categories";
import { playerGenderOptions, sideOptions } from "@/lib/labels";
import { cn, slugify } from "@/lib/utils";
import type { Player } from "@/types/models";

type PlayerFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  player?: Player;
  submitLabel: string;
};

export function PlayerForm({ action, player, submitLabel }: PlayerFormProps) {
  const { state, errors, pending, onSubmit } = useAdminForm(action);

  const [firstName, setFirstName] = useState(player?.first_name ?? "");
  const [lastName, setLastName] = useState(player?.last_name ?? "");
  const [slug, setSlug] = useState(player?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(player));
  const currentSlug = slugTouched ? slug : slugify(`${firstName} ${lastName}`);

  const [category, setCategory] = useState(player?.category ?? "");
  /** Cambió de categoría: hay que decidir qué pasa con los puntos que traía. */
  const movedCategory = Boolean(
    player && category && category !== player.category,
  );

  const numberField = (
    name: "ranking_points" | "matches_played" | "matches_won" | "titles",
    label: string,
  ) => (
    <Field name={name} label={label} error={errors[name]}>
      <Input
        {...fieldProps(name, errors[name])}
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        defaultValue={player?.[name] ?? 0}
        onWheel={(event) => event.currentTarget.blur()}
      />
    </Field>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {state.message && <Alert tone="danger">{state.message}</Alert>}
        {state.ok && <Alert tone="success">Guardamos los cambios.</Alert>}

        <Card className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <Field name="first_name" label="Nombre" error={errors.first_name}>
            <Input
              {...fieldProps("first_name", errors.first_name)}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="off"
              required
            />
          </Field>
          <Field name="last_name" label="Apellido" error={errors.last_name}>
            <Input
              {...fieldProps("last_name", errors.last_name)}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="off"
              required
            />
          </Field>
          <Field
            name="slug"
            label="Link del jugador"
            error={errors.slug}
            hint={`/jugadores/${currentSlug || "…"} · también es el “Código” de la planilla de puntos`}
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
          <Field name="gender" label="Rama" error={errors.gender}>
            <Select
              {...fieldProps("gender", errors.gender)}
              defaultValue={player?.gender ?? "masculino"}
            >
              {playerGenderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field name="category" label="Categoría" error={errors.category}>
            <Select
              {...fieldProps("category", errors.category)}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
            >
              <option value="" disabled>
                Elegí una
              </option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.label}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field name="side" label="Lado" optional error={errors.side}>
            <Select
              {...fieldProps("side", errors.side)}
              defaultValue={player?.side ?? ""}
            >
              <option value="">Sin definir</option>
              {sideOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field name="club" label="Club" optional>
            <Input {...fieldProps("club")} defaultValue={player?.club ?? ""} />
          </Field>
          <Field name="city" label="Ciudad" optional>
            <Input {...fieldProps("city")} defaultValue={player?.city ?? ""} />
          </Field>
          <Field
            name="bio"
            label="Sobre el jugador"
            optional
            className="sm:col-span-2"
          >
            <Textarea
              {...fieldProps("bio")}
              rows={4}
              defaultValue={player?.bio ?? ""}
            />
          </Field>
        </Card>

        {/* Al editar, los puntos se cambian solo con "Corregir puntos" (queda el motivo en el historial). */}
        <Card
          className={cn(
            "grid gap-5 p-5 sm:p-6",
            player ? "sm:grid-cols-3" : "sm:grid-cols-4",
          )}
        >
          {!player && numberField("ranking_points", "Puntos")}
          {numberField("matches_played", "PJ")}
          {numberField("matches_won", "PG")}
          {numberField("titles", "Títulos")}
        </Card>
      </div>

      <div className="space-y-6">
        {movedCategory && player && (
          <Card className="space-y-2 border-accent p-5 sm:p-6">
            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                name="reset_points"
                defaultChecked
                className="size-5 accent-noche-950"
              />
              Reiniciar los puntos
            </label>
            <p className="text-xs text-muted-foreground">
              Pasa de {player.category} a {category}. Con esto arranca de cero
              en la categoría nueva y queda el motivo en su historial. Si lo
              destildás, se lleva los {player.ranking_points} puntos que tiene.
            </p>
          </Card>
        )}
        <Card className="space-y-2 p-5 sm:p-6">
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              name="inactive"
              defaultChecked={player ? !player.active : false}
              className="size-5 accent-noche-950"
            />
            Ya no compite
          </label>
          <p className="text-xs text-muted-foreground">
            Sale del ranking y del inicio, pero conserva sus puntos y su
            historial. Destildalo para que vuelva.
          </p>
        </Card>
        <Card className="space-y-5 p-5 sm:p-6">
          <ImageUpload
            name="photo_url"
            label="Foto"
            folder="jugadores"
            ratio="square"
            defaultValue={player?.photo_url}
            hint="Cuadrada, con la cara centrada"
          />
          {errors.photo_url && (
            <p className="text-sm text-danger">{errors.photo_url}</p>
          )}
          <SubmitButton
            className="w-full"
            pending={pending}
            pendingLabel="Guardando…"
          >
            {submitLabel}
          </SubmitButton>
        </Card>
      </div>
    </form>
  );
}
