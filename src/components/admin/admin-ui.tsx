import type { ComponentProps, ReactNode } from "react";
import { FieldError, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Título de cada pantalla del panel, con acciones a la derecha. */
export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-4xl leading-none font-bold uppercase">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Título de un bloque de formulario, con el número de paso a la izquierda. */
export function FormSection({
  step,
  title,
  description,
  className,
}: {
  step?: number;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      {step !== undefined && (
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground"
          aria-hidden="true"
        >
          {step}
        </span>
      )}
      <div>
        <h2 className="font-display text-2xl leading-8 font-bold uppercase">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

/** Etiqueta + control + error (o ayuda) de un campo. El control tiene que usar id={name}. */
export function Field({
  name,
  label,
  error,
  hint,
  optional = false,
  className,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={name}>
        {label}
        {optional && (
          <span className="font-normal text-muted-foreground"> (opcional)</span>
        )}
      </Label>
      {children}
      {error ? (
        <FieldError id={`${name}-error`}>{error}</FieldError>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/** Props de accesibilidad para un control con posible error. */
export function fieldProps(name: string, error?: string) {
  return {
    id: name,
    name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${name}-error` : undefined,
  };
}

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-border bg-muted/60 px-4 py-3 text-left text-xs font-semibold tracking-[0.12em] whitespace-nowrap text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={cn("border-b border-border px-4 py-3 align-middle", className)}
      {...props}
    />
  );
}
