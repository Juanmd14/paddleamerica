"use client";

import { useActionState } from "react";
import {
  registerForTournament,
  type RegistrationFormState,
} from "@/app/torneos/[slug]/actions";
import { SubmitButton } from "@/components/submit-button";
import { Alert } from "@/components/ui/alert";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";

type RegistrationFormProps = {
  slug: string;
  /** Categoría del torneo, para sugerirla en el campo. */
  categoryHint: string;
  defaultPhone?: string | null;
};

export function RegistrationForm({
  slug,
  categoryHint,
  defaultPhone,
}: RegistrationFormProps) {
  const [state, formAction] = useActionState<RegistrationFormState, FormData>(
    registerForTournament.bind(null, slug),
    {},
  );
  const values = state.values ?? {};
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message && <Alert tone="danger">{state.message}</Alert>}

      <div>
        <Label htmlFor="partner_name">Nombre y apellido de tu pareja</Label>
        <Input
          id="partner_name"
          name="partner_name"
          autoComplete="off"
          required
          defaultValue={values.partner_name}
          aria-invalid={!!errors.partner_name}
          aria-describedby={
            errors.partner_name ? "partner_name-error" : undefined
          }
        />
        <FieldError id="partner_name-error">{errors.partner_name}</FieldError>
      </div>

      <div>
        <Label htmlFor="contact_phone">Tu teléfono (WhatsApp)</Label>
        <Input
          id="contact_phone"
          name="contact_phone"
          type="tel"
          autoComplete="tel"
          placeholder="2392 123456"
          required
          defaultValue={values.contact_phone ?? defaultPhone ?? ""}
          aria-invalid={!!errors.contact_phone}
          aria-describedby={
            errors.contact_phone ? "contact_phone-error" : undefined
          }
        />
        <FieldError id="contact_phone-error">{errors.contact_phone}</FieldError>
      </div>

      <div>
        <Label htmlFor="category">
          Categoría <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id="category"
          name="category"
          placeholder={categoryHint}
          defaultValue={values.category}
          aria-invalid={!!errors.category}
          aria-describedby={errors.category ? "category-error" : undefined}
        />
        <FieldError id="category-error">{errors.category}</FieldError>
      </div>

      <div>
        <Label htmlFor="notes">
          Observaciones{" "}
          <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Horarios en los que no pueden jugar, etc."
          defaultValue={values.notes}
          aria-invalid={!!errors.notes}
          aria-describedby={errors.notes ? "notes-error" : undefined}
        />
        <FieldError id="notes-error">{errors.notes}</FieldError>
      </div>

      <SubmitButton size="lg" className="w-full" pendingLabel="Enviando…">
        Enviar inscripción
      </SubmitButton>
      <p className="text-center text-xs text-muted-foreground">
        El organizador revisa la inscripción y te confirma el lugar.
      </p>
    </form>
  );
}
