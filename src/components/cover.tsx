import Image from "next/image";
import { CourtLines } from "@/components/court-lines";
import { cn } from "@/lib/utils";

type CoverProps = {
  src?: string | null;
  alt: string;
  sizes?: string;
  className?: string;
};

/** Imagen de portada 16:9. Sin foto, muestra una cancha ilustrada. */
export function Cover({ src, alt, sizes = "100vw", className }: CoverProps) {
  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden bg-noche-900",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-noche-900 via-noche-800 to-pista-900">
          <CourtLines className="absolute inset-0 size-full text-white/15" />
          <span className="absolute top-[30%] left-[64%] size-3 rounded-full bg-oro-400 shadow-[0_0_24px_4px] shadow-oro-400/50" />
        </div>
      )}
    </div>
  );
}
