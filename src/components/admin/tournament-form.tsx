"use client";

import { Info, TriangleAlert } from "lucide-react";
import { type ChangeEvent, useState } from "react";
import { Field, FormSection, fieldProps } from "@/components/admin/admin-ui";
import { ImageUpload } from "@/components/admin/image-upload";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { SubmitButton } from "@/components/submit-button";
import {
  TournamentCard,
  TournamentResultCard,
} from "@/components/tournament-card";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Select, Textarea } from "@/components/ui/input";
import { type FormState, isValidDate } from "@/lib/admin-form";
import {
  type CategoryRules,
  categoryOptions,
  categoryRulesHelp,
  categoryRulesLabel,
} from "@/lib/categories";
import {
  formatDayMonthTime,
  fromDateTimeLocal,
  toDateTimeLocal,
} from "@/lib/format";
import {
  featuredOptions,
  genderLabel,
  tournamentGenderOptions,
  tournamentStatusOptions,
} from "@/lib/labels";
import { cn, slugify } from "@/lib/utils";
import type { Club, Tournament } from "@/types/models";

type TournamentFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  tournament?: Tournament;
  /** Parejas ya anotadas, para que la vista previa muestre los lugares libres reales. */
  taken?: number;
  /** Clubes que se pueden elegir como sede. */
  clubs: Club[];
  /**
   * Panel del club: sin "Destacar en el inicio" (es del admin), el club es
   * obligatorio y el flyer se sube a la carpeta del dueño.
   */
  clubOwnerId?: string;
  submitLabel: string;
};

type CategoryMode = "rango" | "suma" | "libre";

const CATEGORY_MODES: { value: CategoryMode; label: string }[] = [
  { value: "rango", label: "Por categorías" },
  { value: "suma", label: "Suma de la pareja" },
  { value: "libre", label: "Libre" },
];

/** Ejemplos que completan la categoría con un toque. */
const CATEGORY_PRESETS: {
  label: string;
  mode: CategoryMode;
  min?: number;
  max?: number;
  sum?: number;
}[] = [
  { label: "4ta", mode: "rango", min: 4, max: 4 },
  { label: "1ra y 2da", mode: "rango", min: 1, max: 2 },
  { label: "3ra a 5ta", mode: "rango", min: 3, max: 5 },
  { label: "6ta a 8va", mode: "rango", min: 6, max: 8 },
  { label: "Suma 13", mode: "suma", sum: 13 },
  { label: "Libre", mode: "libre" },
];

const SUM_OPTIONS = Array.from({ length: 15 }, (_, index) => index + 2);

/** Qué significa cada estado, debajo del select. */
const STATUS_HELP: Record<string, string> = {
  proximo: "Se ve en el sitio, pero todavía no se puede anotar nadie.",
  inscripciones:
    "Aparece el botón “Inscribirme” para que se anoten las parejas.",
  en_juego: "Se está jugando: ya no se puede anotar nadie.",
  finalizado: "Pasa a Finalizados, con los campeones bien a la vista.",
};

const listFormat = new Intl.ListFormat("es", { type: "conjunction" });

/** Campos que alimentan la vista previa, tal como están en los inputs. */
type Draft = {
  name: string;
  starts_on: string;
  ends_on: string;
  city: string;
  venue: string;
  /** Id del club elegido, o vacío. */
  club_id: string;
  /** Texto de la categoría (solo en modo libre). */
  category: string;
  category_mode: CategoryMode;
  category_min: string;
  category_max: string;
  category_sum: string;
  featured: string;
  sponsor_name: string;
  gender: string;
  status: string;
  capacity: string;
  /** Valor del input datetime-local, en hora argentina. */
  registration_opens_at: string;
  champions: string;
  cover_url: string;
};

/** Reglas de categoría tal como van cargadas (todo null si están incompletas). */
function draftRules(draft: Draft): CategoryRules {
  const min = Number(draft.category_min);
  const max = Number(draft.category_max);
  const sum = Number(draft.category_sum);
  if (draft.category_mode === "rango" && min && max) {
    return {
      category_min: Math.min(min, max),
      category_max: Math.max(min, max),
      category_sum: null,
    };
  }
  if (draft.category_mode === "suma" && sum) {
    return { category_min: null, category_max: null, category_sum: sum };
  }
  return { category_min: null, category_max: null, category_sum: null };
}

function draftCategoryLabel(draft: Draft) {
  return draft.category_mode === "libre"
    ? draft.category.trim() || "Libre"
    : (categoryRulesLabel(draftRules(draft)) ?? "");
}

type TextKey = Exclude<keyof Draft, "category_mode">;

function parseCapacity(value: string) {
  return /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : null;
}

/** El torneo como quedaría guardado. Null hasta que haya fecha de inicio. */
function previewTournament(
  draft: Draft,
  slug: string,
  tournament?: Tournament,
): Tournament | null {
  if (!isValidDate(draft.starts_on)) return null;
  return {
    id: tournament?.id ?? 0,
    created_at: tournament?.created_at ?? "",
    slug,
    name: draft.name.trim() || "Nombre del torneo",
    description: null,
    city: draft.city.trim() || "Ciudad",
    venue: draft.venue.trim() || null,
    club_id: Number(draft.club_id) || null,
    address: null,
    maps_url: null,
    starts_on: draft.starts_on,
    ends_on:
      isValidDate(draft.ends_on) && draft.ends_on > draft.starts_on
        ? draft.ends_on
        : draft.starts_on,
    category: draftCategoryLabel(draft) || "Categoría",
    ...draftRules(draft),
    featured: draft.featured || null,
    sponsor_name: draft.sponsor_name.trim() || null,
    gender: draft.gender,
    status: draft.status,
    prize: null,
    champions: draft.champions.trim() || null,
    cover_url: draft.cover_url || null,
    capacity: parseCapacity(draft.capacity),
    registration_opens_at: fromDateTimeLocal(draft.registration_opens_at),
  };
}

/** Qué pasa al guardar con el estado elegido. */
function saveNotes(draft: Draft): { text: string; warning?: boolean }[] {
  const featured = draft.featured
    ? [{ text: "Aparece destacado en el inicio, con el flyer." }]
    : [];
  return [...statusNotes(draft), ...featured];
}

function statusNotes(draft: Draft): { text: string; warning?: boolean }[] {
  const capacity = parseCapacity(draft.capacity);
  const champions = draft.champions.trim();
  const rules = draftRules(draft);
  const who =
    rules.category_min || rules.category_sum
      ? `Solo se pueden anotar parejas que cumplan “${categoryRulesLabel(rules)}”.`
      : null;

  switch (draft.status) {
    case "inscripciones":
      return [
        { text: "Sale en Torneos con el botón “Inscribirme”." },
        ...(who ? [{ text: who }] : []),
        {
          text: "Cada pareja que se anota te llega a “Inscripciones” de este torneo, para que la confirmes.",
        },
        {
          text: capacity
            ? `Cuando se anoten ${capacity} parejas, no se aceptan más.`
            : "Sin cupo: se pueden anotar todas las parejas que quieran.",
        },
      ];
    case "en_juego":
      return [
        {
          text: "Sale en Torneos como “En juego”. Ya no se puede anotar nadie.",
        },
        {
          text: "Cuando termine, pasalo a “Finalizado” y cargá los campeones.",
        },
      ];
    case "finalizado":
      return [
        { text: "Sale en Torneos, en Finalizados." },
        champions
          ? { text: `Campeones: ${champions}.` }
          : { text: "Todavía no cargaste los campeones.", warning: true },
      ];
    default: {
      const opensAt = fromDateTimeLocal(draft.registration_opens_at);
      return [
        {
          text: "Sale en Torneos como “Próximamente”. Todavía no se puede anotar nadie.",
        },
        opensAt
          ? new Date(opensAt).getTime() > Date.now()
            ? {
                text: `Las inscripciones se abren solas el ${formatDayMonthTime(opensAt)} (hora argentina): a esa hora el Estado pasa a “Inscripciones abiertas”.`,
              }
            : {
                text: "Esa fecha ya pasó: al guardar, las inscripciones se abren en menos de un minuto.",
                warning: true,
              }
          : {
              text: "Si completás cuándo abren las inscripciones, se abren solas a esa hora. Si no, cambiá el Estado a mano.",
            },
      ];
    }
  }
}

export function TournamentForm({
  action,
  tournament,
  taken,
  clubs,
  clubOwnerId,
  submitLabel,
}: TournamentFormProps) {
  const { state, errors, pending, onSubmit } = useAdminForm(action);
  const hasErrors = Object.keys(errors).length > 0;

  // En el panel del club, con un solo club, el torneo nuevo ya arranca en ese club.
  const defaultClub =
    !tournament && clubOwnerId && clubs.length === 1 ? clubs[0] : undefined;
  const [draft, setDraft] = useState<Draft>(() => ({
    name: tournament?.name ?? "",
    starts_on: tournament?.starts_on ?? "",
    ends_on: tournament?.ends_on ?? "",
    city: tournament?.city ?? defaultClub?.city ?? "",
    venue: tournament?.venue ?? defaultClub?.name ?? "",
    club_id:
      tournament?.club_id?.toString() ??
      (defaultClub ? String(defaultClub.id) : ""),
    category:
      tournament && !tournament.category_min && !tournament.category_sum
        ? tournament.category
        : "",
    category_mode: tournament?.category_sum
      ? "suma"
      : tournament && !tournament.category_min
        ? "libre"
        : "rango",
    category_min: tournament?.category_min?.toString() ?? "",
    category_max: tournament?.category_max?.toString() ?? "",
    category_sum: tournament?.category_sum?.toString() ?? "13",
    featured: tournament?.featured ?? "",
    sponsor_name: tournament?.sponsor_name ?? "",
    gender: tournament?.gender ?? "masculino",
    status: tournament?.status ?? "proximo",
    capacity: tournament?.capacity?.toString() ?? "",
    registration_opens_at: tournament?.registration_opens_at
      ? toDateTimeLocal(tournament.registration_opens_at)
      : "",
    champions: tournament?.champions ?? "",
    cover_url: tournament?.cover_url ?? "",
  }));
  const set = (key: TextKey, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const bind = (key: TextKey) => ({
    value: draft[key],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      set(key, event.target.value),
  });

  // El slug se completa solo con el nombre y el año hasta que lo edites a mano.
  const [slug, setSlug] = useState(tournament?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(tournament));
  const currentSlug = slugTouched
    ? slug
    : slugify(`${draft.name} ${draft.starts_on.slice(0, 4)}`);

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

  const preview = previewTournament(draft, currentSlug, tournament);
  const notes = saveNotes(draft);
  const missing = [
    draft.name.trim().length < 3 && "el nombre",
    !isValidDate(draft.starts_on) && "la fecha de inicio",
    draft.city.trim().length < 2 && "la ciudad",
    !draftCategoryLabel(draft) && "la categoría",
  ].filter((item) => typeof item === "string");

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <FormSection
            step={1}
            title="Datos del torneo"
            description="Cómo se llama, cuándo y dónde se juega."
            className="sm:col-span-2"
          />
          <Field
            name="name"
            label="Nombre"
            error={errors.name}
            hint="Ej. Abierto de Primavera. Es el título de la tarjeta y de la página."
            className="sm:col-span-2"
          >
            <Input
              {...fieldProps("name", errors.name)}
              {...bind("name")}
              autoComplete="off"
              required
            />
          </Field>
          <Field
            name="slug"
            label="Link del torneo"
            error={errors.slug}
            hint={`/torneos/${currentSlug || "…"} · ${
              tournament
                ? "Si lo cambiás, los links que ya compartiste dejan de andar."
                : "Se arma solo con el nombre y el año."
            }`}
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
          <Field name="starts_on" label="Empieza" error={errors.starts_on}>
            <Input
              {...fieldProps("starts_on", errors.starts_on)}
              {...bind("starts_on")}
              type="date"
              required
            />
          </Field>
          <Field
            name="ends_on"
            label="Termina"
            error={errors.ends_on}
            hint="Si se juega en un solo día, dejala vacía."
          >
            <Input
              {...fieldProps("ends_on", errors.ends_on)}
              {...bind("ends_on")}
              type="date"
              min={draft.starts_on || undefined}
            />
          </Field>
          <Field
            name="club_id"
            label="Club"
            optional={!clubOwnerId}
            error={errors.club_id}
            className="sm:col-span-2"
            hint={
              clubs.length > 0
                ? "El torneo aparece en la página del club. Completa la sede y la ciudad."
                : "Todavía no hay clubes. Cargalos en Panel → Clubes."
            }
          >
            <Select
              {...fieldProps("club_id")}
              value={draft.club_id}
              onChange={(event) => {
                const club = clubs.find(
                  (option) => String(option.id) === event.target.value,
                );
                setDraft((current) => ({
                  ...current,
                  club_id: event.target.value,
                  ...(club ? { venue: club.name, city: club.city } : {}),
                }));
                if (club) {
                  setMapQuery(placeOf(club.address, club.name, club.city));
                }
              }}
            >
              {!clubOwnerId && <option value="">Sin club (sede libre)</option>}
              {clubOwnerId && clubs.length > 1 && (
                <option value="">Elegí el club</option>
              )}
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name} · {club.city}
                </option>
              ))}
            </Select>
          </Field>
          <Field name="city" label="Ciudad" error={errors.city}>
            <Input
              {...fieldProps("city", errors.city)}
              {...bind("city")}
              onBlur={(event) => refreshMap(event.currentTarget.form)}
              required
            />
          </Field>
          <Field name="venue" label="Sede o club" optional error={errors.venue}>
            <Input
              {...fieldProps("venue", errors.venue)}
              {...bind("venue")}
              onBlur={(event) => refreshMap(event.currentTarget.form)}
            />
          </Field>
        </Card>

        <Card className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <FormSection
            step={2}
            title="Categoría y rama"
            description="Quiénes pueden jugar. Se ve arriba del nombre, en la tarjeta y en la página del torneo."
            className="sm:col-span-2"
          />
          <fieldset className="sm:col-span-2">
            <legend className="mb-1.5 text-sm font-medium text-foreground-soft">
              Categoría
            </legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {CATEGORY_MODES.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex h-11 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors has-focus-visible:ring-2 has-focus-visible:ring-pista-200",
                    draft.category_mode === option.value
                      ? "border-noche-950 bg-noche-950 text-white"
                      : "border-border-strong bg-surface hover:bg-muted",
                  )}
                >
                  <input
                    type="radio"
                    name="category_mode"
                    value={option.value}
                    checked={draft.category_mode === option.value}
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        category_mode: option.value,
                      }))
                    }
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <FieldError id="category-error">{errors.category}</FieldError>
          </fieldset>

          {draft.category_mode === "rango" && (
            <>
              <Field
                name="category_min"
                label="Desde"
                hint="La categoría más alta que puede jugar."
              >
                <Select
                  {...fieldProps("category_min", errors.category)}
                  {...bind("category_min")}
                >
                  <option value="">Elegí…</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                name="category_max"
                label="Hasta"
                hint="La más baja. Si es una sola, elegí la misma."
              >
                <Select
                  {...fieldProps("category_max", errors.category)}
                  {...bind("category_max")}
                >
                  <option value="">Elegí…</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </>
          )}
          {draft.category_mode === "suma" && (
            <Field
              name="category_sum"
              label="La pareja tiene que sumar"
              hint="O más. Ej. 6ta + 7ma = 13."
            >
              <Select
                {...fieldProps("category_sum", errors.category)}
                {...bind("category_sum")}
              >
                {SUM_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    Suma {value}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {draft.category_mode === "libre" && (
            <Field
              name="category"
              label="Texto"
              optional
              hint="No se controla quién se anota."
            >
              <Input
                {...fieldProps("category", errors.category)}
                {...bind("category")}
                placeholder="Ej. Libre, Top 8 del ranking"
                maxLength={60}
                autoComplete="off"
              />
            </Field>
          )}
          <Field
            name="gender"
            label="Rama"
            error={errors.gender}
            hint="Mixto: parejas de hombre y mujer."
          >
            <Select
              {...fieldProps("gender", errors.gender)}
              {...bind("gender")}
            >
              {tournamentGenderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="sm:col-span-2">
            <p
              id="category-examples"
              className="text-sm font-medium text-foreground-soft"
            >
              Ejemplos
            </p>
            <div
              role="group"
              aria-labelledby="category-examples"
              className="mt-2 flex flex-wrap gap-2"
            >
              {CATEGORY_PRESETS.map((preset) => {
                const active =
                  draft.category_mode === preset.mode &&
                  draftCategoryLabel(draft) === preset.label;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        category_mode: preset.mode,
                        category_min: preset.min?.toString() ?? "",
                        category_max: preset.max?.toString() ?? "",
                        category_sum:
                          preset.sum?.toString() ?? current.category_sum,
                        category: preset.mode === "libre" ? "Libre" : "",
                      }))
                    }
                    className={cn(
                      "inline-flex h-9 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border-strong bg-surface hover:bg-muted",
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-sm text-foreground-soft">
              {draft.category_mode === "libre"
                ? "Se puede anotar cualquier categoría: el texto es solo informativo."
                : draftCategoryLabel(draft)
                  ? `${categoryRulesHelp(draftRules(draft))} Al anotarse, el sitio no deja inscribirse a quien no cumpla.`
                  : "Elegí las categorías que pueden jugar."}
            </p>
          </div>

          <div className="rounded-lg border border-dashed border-border-strong bg-muted/40 p-4 sm:col-span-2">
            <p className="text-xs text-muted-foreground">
              En la tarjeta del torneo se ve así:
            </p>
            <p className="mt-3 text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
              {draftCategoryLabel(draft) || "Categoría"} ·{" "}
              {genderLabel(draft.gender)}
            </p>
            <p className="mt-1.5 font-display text-2xl leading-none font-bold uppercase">
              {draft.name.trim() || "Nombre del torneo"}
            </p>
          </div>
        </Card>

        <Card className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <FormSection
            step={3}
            title="Inscripciones"
            description="Si se puede anotar gente y cuántas parejas entran."
            className="sm:col-span-2"
          />
          <Field
            name="status"
            label="Estado"
            error={errors.status}
            hint={STATUS_HELP[draft.status]}
            className="sm:col-span-2"
          >
            <Select
              {...fieldProps("status", errors.status)}
              {...bind("status")}
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
            hint="Cuando se llena, no se aceptan más parejas. Vacío = sin límite."
          >
            <Input
              {...fieldProps("capacity", errors.capacity)}
              {...bind("capacity")}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="Ej. 16"
              // Sin esto, la ruedita del mouse cambia el cupo al scrollear la página.
              onWheel={(event) => event.currentTarget.blur()}
            />
          </Field>
          <Field
            name="registration_opens_at"
            label="Abren las inscripciones"
            optional
            error={errors.registration_opens_at}
            hint={
              draft.status === "proximo"
                ? "Día y hora (argentina). A esa hora se abren solas, sin que tengas que tocar nada."
                : "Solo se usa mientras el Estado sea “Próximamente”."
            }
          >
            <Input
              {...fieldProps(
                "registration_opens_at",
                errors.registration_opens_at,
              )}
              {...bind("registration_opens_at")}
              type="datetime-local"
            />
          </Field>
        </Card>

        <Card className="space-y-5 p-5 sm:p-6">
          <FormSection
            step={4}
            title={clubOwnerId ? "Flyer" : "Flyer y destacado"}
            description="Opcional. Sin flyer, la tarjeta muestra la fecha y la ciudad sobre una cancha (mirá la vista previa)."
          />
          {!clubOwnerId && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                name="featured"
                label="Destacar en el inicio"
                error={errors.featured}
                hint="Sale grande arriba de todo, con el flyer. Si hay varios, el más cercano."
              >
                <Select
                  {...fieldProps("featured", errors.featured)}
                  {...bind("featured")}
                >
                  <option value="">No destacar</option>
                  {featuredOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {draft.featured === "sponsor" && (
                <Field
                  name="sponsor_name"
                  label="Sponsor"
                  optional
                  error={errors.sponsor_name}
                  hint="Se lee “Sponsoreado por …”."
                >
                  <Input
                    {...fieldProps("sponsor_name", errors.sponsor_name)}
                    {...bind("sponsor_name")}
                    maxLength={80}
                    placeholder="Ej. Bandeja Club"
                    autoComplete="off"
                  />
                </Field>
              )}
            </div>
          )}
          <div>
            <ImageUpload
              name="cover_url"
              label="Imagen"
              folder={clubOwnerId ? "flyers-club" : "flyers"}
              subfolder={clubOwnerId}
              ratio="flyer"
              defaultValue={tournament?.cover_url}
              hint="Ideal 1080 × 1350 (formato Instagram)"
              onChange={(url) => set("cover_url", url)}
            />
            {errors.cover_url && (
              <p className="mt-1.5 text-sm text-danger">{errors.cover_url}</p>
            )}
          </div>
        </Card>

        <Card className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <FormSection
            step={5}
            title="Ubicación"
            description="Se muestra en un mapa con el botón “Cómo llegar”."
            className="sm:col-span-2"
          />
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

        <Card className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <FormSection
            step={6}
            title="Más información"
            description="Opcional. Se ve en la página del torneo."
            className="sm:col-span-2"
          />
          <Field
            name="description"
            label="Descripción"
            optional
            className="sm:col-span-2"
            hint="Formato, horarios, qué incluye la inscripción… Dejá una línea en blanco entre párrafos."
          >
            <Textarea
              {...fieldProps("description")}
              rows={7}
              defaultValue={tournament?.description ?? ""}
            />
          </Field>
          <Field
            name="prize"
            label="Premios"
            optional
            hint="Ej. Trofeos y $200.000 para los campeones"
          >
            <Input
              {...fieldProps("prize")}
              defaultValue={tournament?.prize ?? ""}
            />
          </Field>
          <Field
            name="champions"
            label="Campeones"
            optional
            hint="Cargalos cuando termine. Ej. Gómez / Ibarra"
          >
            <Input {...fieldProps("champions")} {...bind("champions")} />
          </Field>
        </Card>
      </div>

      {/* En pantallas grandes el botón va arriba para que no lo tape la vista previa; en celular, al final. */}
      <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto">
        <Card className="p-5 sm:p-6 lg:order-2">
          <h2 className="font-display text-2xl font-bold uppercase">
            Vista previa
          </h2>
          <p className="text-sm text-muted-foreground">
            {draft.status === "finalizado"
              ? "Así se ve en Torneos, en Finalizados."
              : "Así se ve la tarjeta en Torneos."}{" "}
            Cambia mientras completás.
          </p>
          <div className="mt-5">
            {!preview ? (
              <p className="rounded-lg border border-dashed border-border-strong p-6 text-center text-sm text-muted-foreground">
                Poné la fecha de inicio para ver cómo queda.
              </p>
            ) : draft.status === "finalizado" ? (
              <div inert className="mx-auto max-w-sm">
                <TournamentResultCard tournament={preview} />
              </div>
            ) : (
              <div inert className="mx-auto max-w-[13rem]">
                <TournamentCard tournament={preview} taken={taken} />
              </div>
            )}
          </div>
        </Card>

        <Card className="space-y-4 p-5 sm:p-6 lg:order-1">
          <h2 className="font-display text-2xl font-bold uppercase">
            {tournament ? "Al guardar" : "Al crear el torneo"}
          </h2>
          <ul className="space-y-2.5 text-sm">
            {notes.map((note) => (
              <li
                key={note.text}
                className={cn(
                  "flex gap-2",
                  note.warning
                    ? "font-medium text-warning"
                    : "text-foreground-soft",
                )}
              >
                {note.warning ? (
                  <TriangleAlert
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <Info
                    className="mt-0.5 size-4 shrink-0 text-accent"
                    aria-hidden="true"
                  />
                )}
                {note.text}
              </li>
            ))}
          </ul>

          {state.message && <Alert tone="danger">{state.message}</Alert>}
          {hasErrors ? (
            <Alert tone="danger">
              No se guardó: revisá los campos marcados en rojo.
            </Alert>
          ) : (
            missing.length > 0 && (
              <p className="flex gap-2 rounded-lg border border-warning-border bg-warning-soft px-4 py-3 text-sm text-warning">
                <TriangleAlert
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                Te falta completar {listFormat.format(missing)}.
              </p>
            )
          )}
          {state.ok && <Alert tone="success">Guardamos los cambios.</Alert>}

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
