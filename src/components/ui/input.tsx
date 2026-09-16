import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "block h-11 w-full rounded-lg border border-border-strong bg-surface px-3 text-foreground outline-none placeholder:text-noche-400 focus:border-accent focus:ring-2 focus:ring-pista-200 aria-invalid:border-danger aria-invalid:ring-danger-soft",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-sm font-medium text-foreground-soft",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "block min-h-24 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-foreground outline-none placeholder:text-noche-400 focus:border-accent focus:ring-2 focus:ring-pista-200 aria-invalid:border-danger aria-invalid:ring-danger-soft",
        className,
      )}
      {...props}
    />
  );
}

/** Mensaje de error debajo de un campo. */
export function FieldError({ id, children }: ComponentProps<"p">) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-danger">
      {children}
    </p>
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "block h-11 w-full rounded-lg border border-border-strong bg-surface px-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-pista-200 aria-invalid:border-danger aria-invalid:ring-danger-soft",
        className,
      )}
      {...props}
    />
  );
}
