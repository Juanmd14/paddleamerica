"use client";

import { Check } from "lucide-react";
import { setProfileBirthdate } from "@/app/admin/usuarios/actions";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { SubmitButton } from "@/components/submit-button";
import { FieldError, Input } from "@/components/ui/input";

/** Fecha de nacimiento de una cuenta (el jugador la carga una vez; el admin la corrige). */
export function ProfileBirthdateForm({
  userId,
  name,
  birthdate,
}: {
  userId: string;
  name: string;
  birthdate: string | null;
}) {
  const { state, pending, onSubmit } = useAdminForm(
    setProfileBirthdate.bind(null, userId),
  );
  const errorId = `nacimiento-${userId}-error`;

  return (
    <form onSubmit={onSubmit}>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          name="birthdate"
          defaultValue={birthdate ?? ""}
          aria-label={`Fecha de nacimiento de ${name}`}
          aria-invalid={state.message ? true : undefined}
          aria-describedby={state.message ? errorId : undefined}
          className="w-44"
        />
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
