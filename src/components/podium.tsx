import Image from "next/image";
import Link from "next/link";
import {
  ClimbBadge,
  PointsGain,
  TREND_BADGE,
  TREND_GAIN,
} from "@/components/ranking-trend";
import { formatNumber } from "@/lib/format";
import { playerName, shortPlayerName } from "@/lib/labels";
import type { RankingTrend } from "@/lib/ranking-trends";
import { cn } from "@/lib/utils";
import type { Player } from "@/types/models";

/**
 * El top 3 de una categoría en un podio de tres escalones: el 2 a la
 * izquierda, el 1 en el medio y más alto, el 3 a la derecha. Cada puesto
 * lleva su metal (oro, plata, bronce) en el aro de la foto, el escalón y el
 * número. El 4 en adelante va a la tabla.
 */

export const EN_EL_PODIO = 3;

type Metal = {
  name: string;
  /** Color sólido del metal: aro de la foto y número del escalón. */
  color: string;
  /** Degradé del frente del escalón. */
  step: string;
  /** Alto del escalón. */
  height: string;
};

const METALS: Record<number, Metal> = {
  1: {
    name: "Oro",
    color: "#ffd84d",
    step: "linear-gradient(180deg, #ffe27a 0%, #e0b62a 100%)",
    height: "h-32 sm:h-40 md:h-44",
  },
  2: {
    name: "Plata",
    color: "#d9dee8",
    step: "linear-gradient(180deg, #eef1f6 0%, #a9b1c2 100%)",
    height: "h-24 sm:h-32 md:h-36",
  },
  3: {
    name: "Bronce",
    color: "#e0a06a",
    step: "linear-gradient(180deg, #eab287 0%, #b56f3a 100%)",
    height: "h-20 sm:h-24 md:h-28",
  },
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function PodiumPhoto({
  player,
  position,
}: {
  player: Player;
  position: number;
}) {
  const name = playerName(player);
  const first = position === 1;

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-vidrio-panel font-titulo font-bold text-vidrio-texto",
        first
          ? "size-20 border-4 text-2xl sm:size-28 sm:text-3xl md:size-32"
          : "size-16 border-[3px] text-xl sm:size-22 sm:text-2xl md:size-24",
      )}
      style={{
        borderColor: METALS[position].color,
        boxShadow: first
          ? `0 0 0 6px color-mix(in srgb, ${METALS[1].color} 18%, transparent), 0 12px 40px -8px color-mix(in srgb, ${METALS[1].color} 45%, transparent)`
          : undefined,
      }}
    >
      {player.photo_url ? (
        <Image
          src={player.photo_url}
          alt={name}
          fill
          sizes="128px"
          className="object-cover"
        />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
}

export type PodiumProps = {
  /** Del 1 al 3, ya ordenados por puntos. Puede venir con menos. */
  players: Player[];
  /** "1ra caballeros", "5ta damas"... */
  title: string;
  /** "Actualizado al 10 de septiembre de 2026" */
  eyebrow?: string;
  /** Puntos del último mes y puestos subidos, por id de jugador. */
  trends?: Map<number, RankingTrend>;
  className?: string;
};

export function Podium({
  players,
  title,
  eyebrow,
  trends,
  className,
}: PodiumProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-vidrio-noche text-vidrio-texto",
        className,
      )}
      aria-label={`Podio de ${title}`}
    >
      {/* Luz de escenario detrás del primer puesto. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-full"
        style={{
          background:
            "radial-gradient(ellipse 55% 60% at 50% 38%, color-mix(in srgb, var(--color-vidrio-pelota) 14%, transparent), transparent 70%)",
        }}
      />

      <div className="relative px-4 pt-6 text-center sm:px-6 md:pt-8">
        {eyebrow ? (
          <p className="font-dato text-[10px] font-bold tracking-[0.18em] text-vidrio-pelota uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 font-titulo text-[30px] leading-[0.92] font-extrabold tracking-[-0.02em] uppercase sm:text-[38px] md:text-[46px]">
          {title}
        </h2>
      </div>

      <div className="relative mx-auto mt-8 max-w-3xl px-3 sm:px-6">
        <ol className="grid grid-cols-3 items-end gap-2 sm:gap-4">
          {[1, 2, 3].map((position) => {
            const player = players[position - 1];
            const metal = METALS[position];
            const trend = player ? trends?.get(player.id) : undefined;

            return (
              <li
                key={position}
                // Se lee 1, 2, 3 pero se ve 2 · 1 · 3.
                className={cn(
                  "flex min-w-0 flex-col items-center",
                  position === 1 && "order-2",
                  position === 2 && "order-1",
                  position === 3 && "order-3",
                )}
              >
                {player ? (
                  <Link
                    href={`/jugadores/${player.slug}`}
                    className="group flex w-full min-w-0 flex-col items-center px-1 pb-3 text-center"
                  >
                    <PodiumPhoto player={player} position={position} />
                    <span className="mt-3 flex max-w-full items-center justify-center gap-1.5 font-dato text-sm leading-tight font-semibold group-hover:underline sm:text-base">
                      <span className="min-w-0 truncate">
                        <span className="sm:hidden">
                          {shortPlayerName(player)}
                        </span>
                        <span className="hidden sm:inline">
                          {playerName(player)}
                        </span>
                      </span>
                      <ClimbBadge
                        trend={trend}
                        className={cn(TREND_BADGE, "hidden sm:inline-flex")}
                      />
                    </span>
                    {player.club ? (
                      <span className="mt-0.5 hidden max-w-full truncate font-dato text-xs text-vidrio-tenue sm:block">
                        {player.club}
                      </span>
                    ) : null}
                    <span className="mt-1.5 font-dato text-base leading-none font-bold tabular-nums sm:text-lg">
                      {formatNumber(player.ranking_points)}
                      <span className="ml-1 text-[10px] tracking-[0.1em] text-vidrio-tenue">
                        PTS
                      </span>
                    </span>
                    <PointsGain
                      trend={trend}
                      compact
                      className={cn("mt-1", TREND_GAIN)}
                    />
                  </Link>
                ) : (
                  <span className="flex flex-col items-center pb-3">
                    <span
                      className={cn(
                        "flex items-center justify-center rounded-full border-2 border-dashed border-vidrio-linea",
                        position === 1
                          ? "size-20 sm:size-28 md:size-32"
                          : "size-16 sm:size-22 md:size-24",
                      )}
                      aria-hidden="true"
                    />
                    <span className="mt-3 font-dato text-[10px] font-bold tracking-[0.18em] text-vidrio-tenue/70 uppercase">
                      Libre
                    </span>
                  </span>
                )}

                {/* El escalón. */}
                <div
                  className={cn(
                    // El número y el metal van uno debajo del otro: el escalón más bajo
                    // (el 3) tiene que tener lugar para los dos sin que se pisen.
                    "flex w-full flex-col items-center gap-1 rounded-t-md pt-2 shadow-[inset_0_2px_0_rgb(255_255_255/0.45)] sm:pt-3",
                    metal.height,
                  )}
                  style={{ background: metal.step }}
                >
                  <span
                    className="font-titulo text-3xl leading-none font-extrabold text-vidrio-noche/85 sm:text-4xl md:text-5xl"
                    aria-label={`Puesto ${position}`}
                  >
                    {position}
                  </span>
                  <span className="font-dato text-[9px] leading-none font-bold tracking-[0.2em] text-vidrio-noche/60 uppercase sm:text-[10px]">
                    {metal.name}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
        {/* La base del podio. */}
        <div aria-hidden="true" className="h-2 bg-vidrio-linea" />
      </div>
      <div className="h-6 md:h-8" aria-hidden="true" />
    </section>
  );
}
