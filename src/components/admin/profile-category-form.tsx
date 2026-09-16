"use client";

import { Check } from "lucide-react";
import { setProfileCategory } from "@/app/admin/usuarios/actions";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { SubmitButton } from "@/components/submit-button";
import { FieldError, Select } from "@/components/ui/input";
import { categoryOptions } from "@/lib/categories";

/** Selector de categoría de una cuenta, en una fila del panel. */
export function ProfileCategoryForm({
  userId,
  name,
  category,
}: {
  userId: string;
  name: string;
  category: number | null;
}) {
  const { state, pending, onSubmit } = useAdminForm(
    setProfileCategory.bind(null, userId),
  );
  const errorId = `categoria-${userId}-error`;

  return (
    <form onSubmit={onSubmit}>
      <div className="flex items-center gap-2">
        <Select
          name="category"
          defaultValue={category ?? ""}
          aria-label={`Categoría de ${name}`}
          aria-invalid={state.message ? true : undefined}
          aria-describedby={state.message ? errorId : undefined}
          className="w-36"
        >
          <option value="">Sin categoría</option>
          {categoryOptions.map((option) => (
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
