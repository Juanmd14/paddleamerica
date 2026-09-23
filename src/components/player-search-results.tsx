import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatNumber } from "@/lib/format";
import { playerName, playerPhoto, rankingTitle } from "@/lib/labels";
import type { Player } from "@/types/models";

/**
 * Resultados del buscador de /jugadores, en Nocturno de vidrio como la tabla.
 * Mezcla categorías y ramas, así que cada fila dice dónde juega el jugador.
 */
export function PlayerSearchResults({ players }: { players: Player[] }) {
  return (
    <ol className="bg-vidrio-noche text-vidrio-texto">
      {players.map((player) => (
        <li
          key={player.id}
          className="border-b border-vidrio-linea/50 last:border-b-0"
        >
          <Link
            href={`/jugadores/${player.slug}`}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-vidrio-panel sm:px-6"
          >
            <Avatar
              name={playerName(player)}
              src={playerPhoto(player)}
              size="sm"
              className="rounded-none bg-vidrio-panel text-vidrio-pelota"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-dato font-semibold">
                {playerName(player)}
              </p>
              <p className="truncate font-dato text-xs text-vidrio-tenue">
                {[player.club, player.city].filter(Boolean).join(" · ")}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-vidrio-linea px-2.5 py-1 font-dato text-[11px] font-bold tracking-[0.06em] uppercase">
              {rankingTitle(player.category, player.gender)}
            </span>
            <span className="hidden w-20 shrink-0 text-right font-dato text-lg leading-none font-bold tabular-nums sm:block">
              {formatNumber(player.ranking_points)}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
