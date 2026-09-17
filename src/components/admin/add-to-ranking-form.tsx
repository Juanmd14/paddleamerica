"use client";

import { ListPlus } from "lucide-react";
import { addProfileToRanking } from "@/app/admin/usuarios/actions";
import { Field, fieldProps } from "@/components/admin/admin-ui";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { SubmitButton } from "@/components/submit-button";
import { Alert } from "@/components/ui/alert";
import { Input, Select } from "@/components/ui/input";
import { branchLabel, CATEGORIES } from "@/lib/labels";

/** Crea el jugador del ranking de una cuenta, con los puntos que ya trae. */
export function AddToRankingForm({
  userId,
  defaultCategory,
}: {
  userId: string;
  /** "7ma", sale de la categoría de la cuenta si tiene. */
  defaultCategory: string | null;
}) {
  const { state, errors, pending, onSubmit } = useAdminForm(
    addProfileToRanking.bind(null, userId),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {state.message && <Alert tone="danger">{state.message}</Alert>}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="gender" label="Rama" error={errors.gender}>
          <Select {...fieldProps("gender", errors.gender)} defaultValue="">
            <option value="" disabled>
              Elegí
            </option>
            {["masculino", "femenino"].map((gender) => (
              <option key={gender} value={gender}>
                {branchLabel(gender)}
              </option>
            ))}
          </Select>
        </Field>
        <Field name="category" label="Categoría" error={errors.category}>
          <Select
            {...fieldProps("category", errors.category)}
            defaultValue={defaultCategory ?? ""}
          >
            <option value="" disabled>
              Elegí
            </option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          name="ranking_points"
          label="Puntos iniciales"
          error={errors.ranking_points}
        >
          <Input
            {...fieldProps("ranking_points", errors.ranking_points)}
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            placeholder="Ej. 1400"
            onWheel={(event) => event.currentTarget.blur()}
          />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">
        Los puntos con los que llega (de otros circuitos o temporadas). Después
        se le suman los de cada torneo. No cuentan como “ganados este mes”.
      </p>
      <SubmitButton pending={pending} pendingLabel="Sumando…">
        <ListPlus className="size-4" aria-hidden="true" />
        Agregar al ranking
      </SubmitButton>
    </form>
  );
}
