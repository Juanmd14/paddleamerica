"use client";

import { Field, fieldProps } from "@/components/admin/admin-ui";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { SubmitButton } from "@/components/submit-button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/admin-form";

/** Vincula un dueño al club por su @usuario. */
export function ClubOwnerForm({
  action,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const { state, errors, pending, onSubmit } = useAdminForm(action);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      {state.message && <Alert tone="danger">{state.message}</Alert>}
      {state.ok && (
        <Alert tone="success">Listo: ya puede entrar a Mi club.</Alert>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Field
          name="username"
          label="Usuario de la cuenta"
          error={errors.username}
          hint="El @usuario con el que se registró en el sitio."
          className="flex-1"
        >
          <Input
            {...fieldProps("username", errors.username)}
            placeholder="@usuario"
            autoCapitalize="none"
            autoComplete="off"
          />
        </Field>
        <SubmitButton
          pending={pending}
          pendingLabel="Vinculando…"
          className="sm:mt-6"
        >
          Hacer dueño
        </SubmitButton>
      </div>
    </form>
  );
}
