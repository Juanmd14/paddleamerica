"use client";

import { useActionState } from "react";
import { type ProfileFormState, updateProfile } from "@/app/mi-cuenta/actions";
import { SubmitButton } from "@/components/submit-button";
import { Alert } from "@/components/ui/alert";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import { categoryOptions } from "@/lib/categories";

type ProfileFormProps = {
  email: string;
  fullName: string;
  phone: string;
  username: string;
  category: number | null;
};

export function ProfileForm({
  email,
  fullName,
  phone,
  username,
  category,
}: ProfileFormProps) {
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
        <Label htmlFor="profile-username">Usuario</Label>
        <div className="relative">
          <span
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground"
            aria-hidden="true"
          >
            @
          </span>
          <Input
            id="profile-username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            defaultValue={username}
            required
            className="pl-7"
            aria-invalid={!!errors.username}
            aria-describedby="profile-username-hint"
          />
        </div>
        {errors.username ? (
          <FieldError id="profile-username-hint">{errors.username}</FieldError>
        ) : (
          <p
            id="profile-username-hint"
            className="mt-1.5 text-xs text-muted-foreground"
          >
            Con este usuario te invitan a jugar un torneo.
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="profile-category">Tu categoría</Label>
        <Select
          id="profile-category"
          name="category"
          defaultValue={category ?? ""}
          aria-invalid={!!errors.category}
          aria-describedby="profile-category-hint"
        >
          <option value="">Todavía no la cargué</option>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        {errors.category ? (
          <FieldError id="profile-category-hint">{errors.category}</FieldError>
        ) : (
          <p
            id="profile-category-hint"
            className="mt-1.5 text-xs text-muted-foreground"
          >
            Define en qué torneos podés anotarte. El organizador la revisa.
          </p>
        )}
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
