import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  danger: "bg-danger-soft text-danger",
  success: "bg-success-soft text-success",
  info: "bg-pista-50 text-pista-800",
};

/** Mensaje de resultado de un formulario (error, éxito o aviso). */
export function Alert({
  tone,
  children,
  className,
}: {
  tone: keyof typeof tones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      role={tone === "danger" ? "alert" : "status"}
      className={cn("rounded-lg px-4 py-3 text-sm", tones[tone], className)}
    >
      {children}
    </p>
  );
}
