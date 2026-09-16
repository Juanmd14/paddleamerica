"use client";

import type { ComponentProps } from "react";
import { SubmitButton } from "@/components/submit-button";

/** Botón de envío que pide confirmación antes (para borrar o acciones irreversibles). */
export function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  ...props
}: ComponentProps<typeof SubmitButton> & { confirmMessage: string }) {
  return (
    <SubmitButton
      {...props}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    />
  );
}
