import Image from "next/image";
import Link from "next/link";
import courtImage from "@/assets/ranking-cancha.webp";
import { Avatar } from "@/components/ui/avatar";
import { formatNumber } from "@/lib/format";
import { playerName } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Player } from "@/types/models";

/**
 * Color y ubicación de cada puesto: 1º y 3º a la izquierda de la cancha, 2º y 4º a la derecha.
 * En el HTML van en orden (1, 2, 3, 4); la grilla los acomoda en escritorio.
 */
const positions = [
  {
    text: "text-pista-500",
    badge: "bg-pista-600",
    ring: "ring-pista-500/70",
    place: "lg:col-start-1 lg:row-start-1",
  },
  {
    text: "text-noche-300",
    badge: "bg-noche-500",
    ring: "ring-noche-400/70",
    place: "lg:col-start-3 lg:row-start-1",
  },
  {
    text: "text-green-500",
    badge: "bg-green-600",
    ring: "ring-green-500/70",
    place: "lg:col-start-1 lg:row-start-2",
  },
  {
    text: "text-violet-500",
    badge: "bg-violet-600",
    ring: "ring-violet-500/70",
    place: "lg:col-start-3 lg:row-start-2",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/** Los 4 primeros del ranking alrededor de la cancha vista desde arriba. Recibe el ranking ya ordenado. */
export function RankingCourt({ players }: { players: Player[] }) {
  const top = players.slice(0, positions.length);
  if (top.length === 0) return null;

  return (
    <div className="relative">
      <Image
        src={courtImage}
        alt=""
        aria-hidden="true"
        preload
        sizes="(min-width: 1024px) 320px, 60vw"
        className="pointer-events-none absolute top-1/2 left-1/2 h-full w-auto max-w-none -translate-x-1/2 -translate-y-1/2 [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent),linear-gradient(to_bottom,transparent,black_6%,black_94%,transparent)] [mask-composite:intersect] opacity-40 lg:opacity-100"
      />

      <ol className="relative grid gap-4 sm:grid-cols-2 lg:min-h-[560px] lg:grid-cols-[1fr_340px_1fr] lg:grid-rows-2 lg:items-center lg:gap-x-10 lg:gap-y-16">
        {top.map((player, index) => {
          const style = positions[index];
          const name = playerName(player);

          return (
            <li key={player.id} className={style.place}>
              <article className="group relative flex gap-4 rounded-card border border-white/10 bg-noche-950/85 p-4 text-white shadow-2xl shadow-black/40 backdrop-blur transition-colors hover:border-white/25 sm:p-5">
                <Avatar
                  name={name}
                  src={player.photo_url}
                  className={cn(
                    "size-20 rounded-xl bg-noche-800 text-2xl ring-2 sm:size-22",
                    style.ring,
                  )}
                />
                <div className="min-w-0 flex-1 pr-10">
                  <p
                    className={cn(
                      "text-4xl leading-none font-bold tabular-nums",
                      style.text,
                    )}
                  >
                    <span className="sr-only">Puesto </span>
                    {index + 1}
                  </p>
                  <h3 className="mt-1.5 truncate text-lg leading-tight font-semibold">
                    <Link
                      href={`/jugadores/${player.slug}`}
                      className="after:absolute after:inset-0"
                    >
                      {name}
                    </Link>
                  </h3>
                  <p className="mt-0.5 truncate text-sm text-noche-300">
                    {player.club}
                  </p>
                  <p className="truncate text-sm text-noche-300">
                    {player.city}
                  </p>
                  <p className="mt-3 border-t border-white/10 pt-3 text-lg leading-none font-semibold tabular-nums">
                    {formatNumber(player.ranking_points)}
                    <span className="ml-1.5 text-xs font-medium tracking-wide text-noche-400">
                      PTS
                    </span>
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-4 right-4 flex size-9 items-center justify-center rounded-lg text-xs font-bold sm:top-5 sm:right-5",
                    style.badge,
                  )}
                >
                  {initials(name)}
                </span>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
