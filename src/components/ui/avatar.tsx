import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "size-9 text-sm",
  md: "size-12 text-base",
  lg: "size-20 text-2xl",
  xl: "size-32 text-4xl",
};

export type AvatarSize = keyof typeof sizes;
export const avatarSizes = Object.keys(sizes) as AvatarSize[];

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
};

/** Foto del jugador o sus iniciales si no tiene foto. */
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-noche-900 font-display font-bold text-oro-400",
        sizes[size],
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="128px"
          className="object-cover"
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}
