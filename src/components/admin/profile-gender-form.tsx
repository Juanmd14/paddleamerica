"use client";

import { Check } from "lucide-react";
import { setProfileGender } from "@/app/admin/usuarios/actions";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { SubmitButton } from "@/components/submit-button";
import { FieldError, Select } from "@/components/ui/input";
import { playerGenderOptions } from "@/lib/labels";

/** Selector de rama de una cuenta (el jugador la elige una vez; el admin la corrige). */
export function ProfileGenderForm({
  userId,
  name,
  gender,
}: {
  userId: string;
  name: string;
  gender: string | null;
}) {
  const { state, pending, onSubmit } = useAdminForm(
    setProfileGender.bind(null, userId),
  );
  const errorId = `rama-${userId}-error`;

  return (
    <form onSubmit={onSubmit}>
      <div className="flex items-center gap-2">
        <Select
          name="gender"
          defaultValue={gender ?? ""}
          aria-label={`Rama de ${name}`}
          aria-invalid={state.message ? true : undefined}
          aria-describedby={state.message ? errorId : undefined}
          className="w-36"
        >
          <option value="">Sin rama</option>
          {playerGenderOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <SubmitButton
          size="sm"
          variant="outline"
          pending={pending}
          pendingLabel="Guardando…"
        >
          Guardar
        </SubmitButton>
        {state.ok && !pending && (
          <Check
            className="size-4 shrink-0 text-success"
            aria-label="Guardada"
          />
        )}
      </div>
      <FieldError id={errorId}>{state.message}</FieldError>
    </form>
  );
}
