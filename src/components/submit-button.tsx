"use client";

import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type SubmitButtonProps = ComponentProps<typeof Button> & {
  /** Texto mientras se envía el formulario. */
  pendingLabel?: string;
  /** Estado de envío manual (formularios con onSubmit en vez de action). */
  pending?: boolean;
};

/** Botón de envío que se deshabilita y muestra un spinner mientras corre la Server Action. */
export function SubmitButton({
  children,
  pendingLabel,
  pending: pendingOverride,
  disabled,
  ...props
}: SubmitButtonProps) {
  const status = useFormStatus();
  const pending = pendingOverride ?? status.pending;

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      {...props}
    >
      {pending && (
        <LoaderCircle
          className="size-4 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      )}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
