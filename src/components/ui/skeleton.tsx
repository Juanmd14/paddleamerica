import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Bloque gris animado para estados de carga. */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-lg bg-noche-100 motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
