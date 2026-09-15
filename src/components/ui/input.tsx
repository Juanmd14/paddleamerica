import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "block h-11 w-full rounded-lg border border-noche-200 bg-surface px-3 text-foreground outline-none placeholder:text-noche-400 focus:border-accent focus:ring-2 focus:ring-pista-200",
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
        "mb-1.5 block text-sm font-medium text-noche-700",
        className,
      )}
      {...props}
    />
  );
}
