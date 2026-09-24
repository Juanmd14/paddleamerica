"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { type ReactNode, useEffect, useRef } from "react";

export type LightboxPhoto = {
  url: string;
  alt: string;
  /** Texto debajo de la foto (epígrafe, torneo...). */
  caption?: ReactNode;
};

/**
 * Foto en grande sobre la página, con <dialog>. Se cierra con la X, tocando
 * afuera o con Escape; las flechas (y ← →) pasan de foto.
 */
export function PhotoLightbox({
  photos,
  index,
  onChange,
  onClose,
}: {
  photos: LightboxPhoto[];
  /** Foto abierta, o null si el visor está cerrado. */
  index: number | null;
  onChange: (index: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = index !== null;
  const photo = open ? photos[index] : undefined;
  const many = photos.length > 1;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function go(step: number) {
    if (index === null) return;
    onChange((index + step + photos.length) % photos.length);
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        // Cualquier toque que no sea sobre la foto, el epígrafe o un botón cierra.
        if (!(event.target as HTMLElement).closest("[data-keep-open]")) {
          onClose();
        }
      }}
      onKeyDown={(event) => {
        if (!many) return;
        if (event.key === "ArrowLeft") go(-1);
        if (event.key === "ArrowRight") go(1);
      }}
      aria-label={photo?.alt ?? "Foto"}
      className="m-0 size-full max-h-none max-w-none bg-transparent p-0 text-white backdrop:bg-noche-950/90 backdrop:backdrop-blur-sm open:flex"
    >
      <div className="flex size-full flex-col items-center justify-center gap-3 px-4 py-16 sm:px-20">
        {photo && (
          <>
            {/* Tamaño real de la foto (no `fill`), así tocar al costado cierra. */}
            <Image
              key={photo.url}
              data-keep-open
              src={photo.url}
              alt={photo.alt}
              width={1600}
              height={1600}
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="h-auto max-h-[78dvh] w-auto max-w-full rounded-card object-contain shadow-2xl"
            />
            {photo.caption && (
              <div data-keep-open className="text-center text-sm">
                {photo.caption}
              </div>
            )}
            {many && (
              <p className="text-xs text-noche-300">
                {(index ?? 0) + 1} / {photos.length}
              </p>
            )}
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-3 right-3 flex size-11 cursor-pointer items-center justify-center rounded-full bg-noche-900/70 text-white transition-colors hover:bg-noche-800"
      >
        <X className="size-6" aria-hidden="true" />
      </button>
      {many && (
        <>
          <button
            type="button"
            data-keep-open
            onClick={() => go(-1)}
            aria-label="Foto anterior"
            className="absolute top-1/2 left-2 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-noche-900/70 text-white transition-colors hover:bg-noche-800 sm:left-4"
          >
            <ChevronLeft className="size-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            data-keep-open
            onClick={() => go(1)}
            aria-label="Foto siguiente"
            className="absolute top-1/2 right-2 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-noche-900/70 text-white transition-colors hover:bg-noche-800 sm:right-4"
          >
            <ChevronRight className="size-6" aria-hidden="true" />
          </button>
        </>
      )}
    </dialog>
  );
}
