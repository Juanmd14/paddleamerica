"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Botones fijos abajo. */
  footer?: ReactNode;
  /** "sheet": sube desde abajo en celulares (como una app). */
  variant?: "center" | "sheet";
  className?: string;
};

/**
 * Ventana modal con <dialog>: el navegador maneja el foco, Escape y el fondo.
 * Tocar afuera también la cierra.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "center",
  className,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby={titleId}
      className={cn(
        "max-h-[88dvh] w-full flex-col overflow-hidden bg-surface p-0 text-foreground shadow-2xl backdrop:bg-noche-950/60 backdrop:backdrop-blur-sm open:flex",
        variant === "sheet"
          ? "mx-auto mt-auto mb-0 max-w-none rounded-t-card sm:m-auto sm:max-w-lg sm:rounded-card"
          : "m-auto max-w-[calc(100%-2rem)] rounded-card sm:max-w-2xl",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2
            id={titleId}
            className="font-display text-2xl leading-tight font-bold uppercase"
          >
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="-mr-2 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      {footer && (
        <div className="border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          {footer}
        </div>
      )}
    </dialog>
  );
}
