"use client";

import { type FormEvent, startTransition, useActionState } from "react";
import type { FormState } from "@/lib/admin-form";

/**
 * Envía el formulario a una Server Action sin el reset automático de React 19
 * (que borraría lo cargado cuando hay errores de validación).
 */
export function useAdminForm(
  action: (state: FormState, formData: FormData) => Promise<FormState>,
) {
  const [state, formAction, pending] = useActionState(action, {});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return { state, errors: state.errors ?? {}, pending, onSubmit };
}
