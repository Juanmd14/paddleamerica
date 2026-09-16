"use client";

import { Field, fieldProps } from "@/components/admin/admin-ui";
import { ImageUpload } from "@/components/admin/image-upload";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { SubmitButton } from "@/components/submit-button";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import type { FormState } from "@/lib/admin-form";
import { formatNumber } from "@/lib/format";
import { STAT_KEYS, type StatKey, type StatSetting } from "@/lib/labels";

type SiteSettingsFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  heroImageUrl: string | null;
  stats: StatSetting[];
  /** Título y valor automáticos de cada número, para las opciones y los placeholders. */
  automatic: Record<StatKey, { label: string; value: number }>;
};

export function SiteSettingsForm({
  action,
  heroImageUrl,
  stats,
  automatic,
}: SiteSettingsFormProps) {
  const { state, errors, pending, onSubmit } = useAdminForm(action);
  const slots = Array.from({ length: 4 }, (_, index) => stats[index] ?? null);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {state.message && <Alert tone="danger">{state.message}</Alert>}
      {state.ok && (
        <Alert tone="success">
          Guardamos los cambios. Ya se ven en el inicio.
        </Alert>
      )}

      <Card className="p-5 sm:p-6">
        <h2 className="font-display text-2xl font-bold uppercase">
          Foto del inicio
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Va de fondo detrás de “Todo el pádel de la zona”, con un degradé
          oscuro para que el texto se lea. Usá una foto horizontal (ideal 2400 ×
          1200). Sin foto, se muestra la cancha aérea.
        </p>
        <div className="mt-5 max-w-2xl">
          <ImageUpload
            name="hero_image_url"
            label="Foto"
            folder="sitio"
            ratio="wide"
            defaultValue={heroImageUrl}
            hint="Horizontal, con el centro de interés a la derecha"
          />
          {errors.hero_image_url && (
            <p className="mt-1.5 text-sm text-danger">
              {errors.hero_image_url}
            </p>
          )}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="font-display text-2xl font-bold uppercase">
          Números del inicio
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Se calculan solos. Elegí cuáles mostrar y, si hace falta, cambiá el
          título o poné un número a mano (dejalo vacío para que siga siendo
          automático).
        </p>

        <div className="mt-6 space-y-5">
          {slots.map((slot, index) => {
            const keyName = `stat_${index}_key`;
            const labelName = `stat_${index}_label`;
            const valueName = `stat_${index}_value`;
            const auto = slot ? automatic[slot.key] : null;
            return (
              <fieldset
                key={index}
                className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-[1.3fr_1fr_0.6fr]"
              >
                <legend className="px-1 text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
                  Casilla {index + 1}
                </legend>
                <Field
                  name={keyName}
                  label="Qué mostrar"
                  error={errors[keyName]}
                >
                  <Select
                    {...fieldProps(keyName, errors[keyName])}
                    defaultValue={slot?.key ?? ""}
                  >
                    <option value="">No mostrar</option>
                    {STAT_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {automatic[key].label} (
                        {formatNumber(automatic[key].value)})
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  name={labelName}
                  label="Título"
                  optional
                  error={errors[labelName]}
                >
                  <Input
                    {...fieldProps(labelName, errors[labelName])}
                    maxLength={40}
                    placeholder={auto?.label ?? "Automático"}
                    defaultValue={slot?.label ?? ""}
                  />
                </Field>
                <Field
                  name={valueName}
                  label="Número"
                  optional
                  error={errors[valueName]}
                >
                  <Input
                    {...fieldProps(valueName, errors[valueName])}
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    placeholder={auto ? String(auto.value) : "Auto"}
                    defaultValue={slot?.value ?? ""}
                  />
                </Field>
              </fieldset>
            );
          })}
        </div>
      </Card>

      <SubmitButton pending={pending} pendingLabel="Guardando…">
        Guardar cambios
      </SubmitButton>
    </form>
  );
}
