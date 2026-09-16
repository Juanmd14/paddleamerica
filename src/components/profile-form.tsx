"use client";

import { useActionState } from "react";
import { type ProfileFormState, updateProfile } from "@/app/mi-cuenta/actions";
import { SubmitButton } from "@/components/submit-button";
import { Alert } from "@/components/ui/alert";
import { FieldError, Input, Label } from "@/components/ui/input";

type ProfileFormProps = {
  email: string;
  fullName: string;
  phone: string;
};

export function ProfileForm({ email, fullName, phone }: ProfileFormProps) {
  const [state, formAction] = useActionState<ProfileFormState, FormData>(
    updateProfile,
    {},
  );
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message && <Alert tone="danger">{state.message}</Alert>}
      {state.ok && <Alert tone="success">Guardamos tus datos.</Alert>}

      <div>
        <Label htmlFor="profile-email">Email</Label>
        <Input
          id="profile-email"
          value={email}
          readOnly
          disabled
          className="bg-muted text-muted-foreground"
        />
      </div>
      <div>
        <Label htmlFor="profile-name">Nombre y apellido</Label>
        <Input
          id="profile-name"
          name="full_name"
          autoComplete="name"
          defaultValue={fullName}
          required
          aria-invalid={!!errors.full_name}
          aria-describedby={errors.full_name ? "profile-name-error" : undefined}
        />
        <FieldError id="profile-name-error">{errors.full_name}</FieldError>
      </div>
      <div>
        <Label htmlFor="profile-phone">Teléfono (WhatsApp)</Label>
        <Input
          id="profile-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="2392 123456"
          defaultValue={phone}
          aria-invalid={!!errors.phone}
          aria-describedby="profile-phone-hint"
        />
        {errors.phone ? (
          <FieldError id="profile-phone-hint">{errors.phone}</FieldError>
        ) : (
          <p
            id="profile-phone-hint"
            className="mt-1.5 text-xs text-muted-foreground"
          >
            Lo usamos para completar tus inscripciones.
          </p>
        )}
      </div>
      <SubmitButton variant="secondary" pendingLabel="Guardando…">
        Guardar cambios
      </SubmitButton>
    </form>
  );
}
