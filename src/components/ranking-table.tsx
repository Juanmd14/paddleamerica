import Link from "next/link";
import {
  ClimbBadge,
  PointsGain,
  TREND_BADGE,
  TREND_GAIN,
} from "@/components/ranking-trend";
import { Avatar } from "@/components/ui/avatar";
import { formatNumber } from "@/lib/format";
import { playerName, playerPhoto } from "@/lib/labels";
import type { RankingTrend } from "@/lib/ranking-trends";
import { cn } from "@/lib/utils";
import type { Player } from "@/types/models";

/**
 * La tabla del ranking de una categoría, en Nocturno de vidrio.
 *
 * Arranca en el puesto que le pasen: los tres primeros ya están en el podio.
 */

/** Ancho fijo para que los números queden alineados columna a columna. */
const COL_PG = "w-16 shrink-0 text-right tabular-nums";
const COL_TITULOS = "w-16 shrink-0 text-right tabular-nums";
const COL_PUNTOS = "w-20 shrink-0 text-right tabular-nums";
function ColumnHeaders() {
  return (
    <div className="flex items-center gap-3 border-b border-vidrio-linea px-4 py-2.5 font-dato text-[10px] font-bold tracking-[0.14em] text-vidrio-tenue uppercase sm:px-6">
      <span className="w-7 shrink-0 text-center">Pos</span>
      <span className="w-9 shrink-0" aria-hidden="true" />
      <span className="flex-1">Jugador</span>
      <span className={cn(COL_PG, "hidden sm:block")}>PG / PJ</span>
      <span className={cn(COL_TITULOS, "hidden md:block")}>Títulos</span>
      <span className={COL_PUNTOS}>Puntos</span>
    </div>
  );
}

export function RankingTable({
  players,
  /** Puesto de la primera fila. Con el podio arriba, arranca en 4. */
  startAt = 1,
  trends,
  className,
}: {
  players: Player[];
  startAt?: number;
  /** Puntos del último mes y puestos subidos, por id de jugador. */
  trends?: Map<number, RankingTrend>;
  className?: string;
}) {
  return (
    <div className={cn("bg-vidrio-noche text-vidrio-texto", className)}>
      <ColumnHeaders />
      <ol>
        {players.map((player, index) => {
          const position = startAt + index;

          return (
            <li
              key={player.id}
              className="border-b border-vidrio-linea/50 last:border-b-0"
            >
              <Link
                href={`/jugadores/${player.slug}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-vidrio-panel sm:px-6"
              >
                <span className="w-7 shrink-0 text-center font-titulo text-xl font-extrabold text-vidrio-tenue tabular-nums">
                  {position}
                </span>
                <Avatar
                  name={playerName(player)}
                  src={playerPhoto(player)}
                  size="sm"
                  className="rounded-none bg-vidrio-panel text-vidrio-pelota"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-dato font-semibold">
                    <span className="truncate">{playerName(player)}</span>
                    <ClimbBadge
                      trend={trends?.get(player.id)}
                      className={TREND_BADGE}
                    />
                  </p>
                  <p className="truncate font-dato text-xs text-vidrio-tenue">
                    {[player.club, player.city].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className={cn(COL_PG, "hidden font-dato sm:block")}>
                  {player.matches_won}/{player.matches_played}
                </span>
                <span className={cn(COL_TITULOS, "hidden font-dato md:block")}>
                  {player.titles}
                </span>
                <div
                  className={cn(
                    COL_PUNTOS,
                    "font-dato text-lg leading-none font-bold",
                  )}
                >
                  {formatNumber(player.ranking_points)}
                  <PointsGain
                    trend={trends?.get(player.id)}
                    compact
                    className={cn("mt-1", TREND_GAIN)}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
