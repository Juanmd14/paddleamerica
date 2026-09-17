"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Avatar, type AvatarSize } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type ZoomableAvatarProps = {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
};

/**
 * Foto de perfil que se agranda al tocarla, como en Instagram: se abre en un
 * círculo grande sobre fondo oscuro y se cierra tocando en cualquier lado o
 * con Escape. Sin foto, muestra las iniciales y no se puede tocar.
 * No usarla dentro de un link o un botón (anidaría botones).
 */
export function ZoomableAvatar({
  name,
  src,
  size,
  className,
}: ZoomableAvatarProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!src) return <Avatar name={name} size={size} className={className} />;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Ver la foto de ${name} más grande`}
        className="shrink-0 cursor-zoom-in rounded-full transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oro-400 active:scale-95"
      >
        <Avatar name={name} src={src} size={size} className={className} />
      </button>

      <dialog
        ref={dialogRef}
        aria-label={`Foto de ${name}`}
        onClose={() => setOpen(false)}
        // Tocar en cualquier lado (también sobre la foto) la cierra, como en Instagram.
        onClick={() => setOpen(false)}
        className="m-0 h-dvh max-h-none w-screen max-w-none cursor-zoom-out items-center justify-center bg-transparent p-6 backdrop:bg-noche-950/90 backdrop:backdrop-blur-md open:flex"
      >
        {open && (
          <figure className="flex flex-col items-center gap-4 transition duration-200 ease-out starting:scale-75 starting:opacity-0">
            <div className="relative aspect-square w-[min(80vw,28rem)] overflow-hidden rounded-full shadow-2xl ring-4 ring-white/10">
              <Image
                src={src}
                alt={`Foto de ${name}`}
                fill
                sizes="(min-width: 640px) 448px, 80vw"
                className="object-cover"
              />
            </div>
            <figcaption className="font-display text-2xl font-bold text-white uppercase">
              {name}
            </figcaption>
          </figure>
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar"
          className={cn(
            "absolute top-4 right-4 flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20",
          )}
        >
          <X className="size-6" aria-hidden="true" />
        </button>
      </dialog>
    </>
  );
}
