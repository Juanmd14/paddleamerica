import Image from "next/image";
import type { ReactNode } from "react";
import { CourtLines } from "@/components/court-lines";
import { cn } from "@/lib/utils";

/** Fondos para las portadas sin foto; se eligen por `seed` para que dos tarjetas seguidas no sean iguales. */
const placeholders = [
  {
    bg: "from-noche-900 via-noche-800 to-pista-900",
    ball: "top-[30%] left-[64%]",
    flyerBall: "top-[22%] left-[64%]",
  },
  {
    bg: "from-pista-900 via-noche-900 to-noche-950",
    ball: "top-[64%] left-[30%]",
    flyerBall: "top-[36%] left-[30%]",
  },
  {
    bg: "from-noche-800 via-noche-900 to-pista-800",
    ball: "top-[22%] left-[34%]",
    flyerBall: "top-[16%] left-[36%]",
  },
  {
    bg: "from-noche-950 via-pista-900 to-noche-800",
    ball: "top-[58%] left-[72%]",
    flyerBall: "top-[40%] left-[70%]",
  },
];

const ratios = {
  video: "aspect-video",
  /** 4:5, el formato de flyer de Instagram (1080 × 1350). */
  flyer: "aspect-[4/5]",
};

type CoverProps = {
  src?: string | null;
  alt: string;
  sizes?: string;
  ratio?: keyof typeof ratios;
  /** Número estable (ej. el id) para variar el fondo sin foto. */
  seed?: number;
  preload?: boolean;
  className?: string;
  /** Contenido que se muestra sobre el fondo cuando no hay foto. */
  placeholder?: ReactNode;
};

/** Imagen de portada. Sin foto, muestra una cancha ilustrada. */
export function Cover({
  src,
  alt,
  sizes = "100vw",
  ratio = "video",
  seed = 0,
  preload = false,
  className,
  placeholder,
}: CoverProps) {
  const variant = placeholders[Math.abs(seed) % placeholders.length];

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-noche-900",
        ratios[ratio],
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          preload={preload}
          className="object-cover"
        />
      ) : (
        <div className={cn("absolute inset-0 bg-linear-to-br", variant.bg)}>
          <CourtLines
            orientation={ratio === "flyer" ? "vertical" : "horizontal"}
            className="absolute inset-0 size-full text-white/15"
          />
          <span
            className={cn(
              "absolute size-3 rounded-full bg-oro-400 shadow-[0_0_24px_4px] shadow-oro-400/50",
              // En los flyers la pelota va arriba, lejos de la fecha.
              ratio === "flyer" ? variant.flyerBall : variant.ball,
            )}
          />
          {placeholder}
        </div>
      )}
    </div>
  );
}
