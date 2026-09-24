"use client";

import { useActionState } from "react";
import { type ProfileFormState, updateProfile } from "@/app/mi-cuenta/actions";
import { GenderChoice } from "@/components/gender-choice";
import { SubmitButton } from "@/components/submit-button";
import { Alert } from "@/components/ui/alert";
import { FieldError, Input, Label } from "@/components/ui/input";
import { categoryName } from "@/lib/categories";
import { formatDate } from "@/lib/format";
import { genderLabel } from "@/lib/labels";

type ProfileFormProps = {
  email: string;
  fullName: string;
  phone: string;
  username: string;
  category: number | null;
  gender: string | null;
  /** "2003-07-21" o null si todavía no la cargó. */
  birthdate: string | null;
  /** La cuenta está vinculada a un jugador del ranking: categoría y rama salen de ahí. */
  fromRanking?: boolean;
};

export function ProfileForm({
  email,
  fullName,
  phone,
  username,
  category,
  gender,
  birthdate,
  fromRanking = false,
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
      {gender ? (
        <div>
          <Label htmlFor="profile-gender">Tu rama</Label>
          <Input
            id="profile-gender"
            value={genderLabel(gender)}
            readOnly
            disabled
            aria-describedby="profile-gender-hint"
            className="bg-muted text-muted-foreground"
          />
          <p
            id="profile-gender-hint"
            className="mt-1.5 text-xs text-muted-foreground"
          >
            {fromRanking
              ? "Sale de tu ficha en el ranking."
              : "Para cambiarla, pedíselo al organizador."}
          </p>
        </div>
      ) : (
        <div id="rama" className="scroll-mt-32">
          <GenderChoice
            legend="Tu rama"
            describedBy="profile-gender-hint"
            invalid={Boolean(errors.gender)}
          />
          {errors.gender ? (
            <FieldError id="profile-gender-hint">{errors.gender}</FieldError>
          ) : (
            <p
              id="profile-gender-hint"
              className="mt-1.5 text-xs font-medium text-oro-800"
            >
              Elegila para poder anotarte en torneos. Se elige una sola vez:
              después solo la cambia el organizador.
            </p>
          )}
        </div>
      )}
      {birthdate ? (
        <div>
          <Label htmlFor="profile-birthdate">Tu fecha de nacimiento</Label>
          <Input
            id="profile-birthdate"
            value={formatDate(birthdate)}
            readOnly
            disabled
            aria-describedby="profile-birthdate-hint"
            className="bg-muted text-muted-foreground"
          />
          <p
            id="profile-birthdate-hint"
            className="mt-1.5 text-xs text-muted-foreground"
          >
            Solo se usa para los torneos con límite de edad. No se muestra en tu
            perfil. Si está mal, pedíle al organizador que te la corrija.
          </p>
        </div>
      ) : (
        <div id="nacimiento" className="scroll-mt-32">
          <Label htmlFor="profile-birthdate">Tu fecha de nacimiento</Label>
          <Input
            id="profile-birthdate"
            name="birthdate"
            type="date"
            autoComplete="bday"
            aria-invalid={!!errors.birthdate}
            aria-describedby="profile-birthdate-hint"
          />
          {errors.birthdate ? (
            <FieldError id="profile-birthdate-hint">
              {errors.birthdate}
            </FieldError>
          ) : (
            <p
              id="profile-birthdate-hint"
              className="mt-1.5 text-xs font-medium text-oro-800"
            >
              Solo se usa para los torneos con límite de edad. No se muestra en
              tu perfil.
            </p>
          )}
        </div>
      )}
      <div>
        <Label htmlFor="profile-category">Tu categoría</Label>
        <Input
          id="profile-category"
          value={category ? categoryName(category) : "Sin asignar"}
          readOnly
          disabled
          aria-describedby="profile-category-hint"
          className="bg-muted text-muted-foreground"
        />
        <p
          id="profile-category-hint"
          className="mt-1.5 text-xs text-muted-foreground"
        >
          {fromRanking
            ? "Sale de tu ficha en el ranking y define en qué torneos podés anotarte."
            : "La asigna el organizador y define en qué torneos podés anotarte."}
        </p>
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
