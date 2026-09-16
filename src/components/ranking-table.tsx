import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { ClimbBadge, PointsGain } from "@/components/ranking-trend";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";
import { effectiveness, playerName, sideLabel } from "@/lib/labels";
import type { RankingTrend } from "@/lib/ranking-trends";
import { cn } from "@/lib/utils";
import type { Player } from "@/types/models";

const th =
  "px-4 py-3 text-left text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase";
const td = "px-4 py-3 tabular-nums";

/** Tabla completa del ranking (escritorio). La posición sale del orden del array. */
export function RankingTable({
  players,
  trends,
}: {
  players: Player[];
  /** Puntos del último mes y puestos subidos, por id de jugador. */
  trends?: Map<number, RankingTrend>;
}) {
  return (
    <table className="w-full text-sm">
      <thead className="border-b border-border bg-muted/60">
        <tr>
          <th scope="col" className={cn(th, "w-16 text-center")}>
            #
          </th>
          <th scope="col" className={th}>
            Jugador
          </th>
          <th scope="col" className={th}>
            Club
          </th>
          <th scope="col" className={cn(th, "text-center")}>
            Cat.
          </th>
          <th scope="col" className={cn(th, "text-right")}>
            <abbr title="Partidos jugados" className="no-underline">
              PJ
            </abbr>
          </th>
          <th scope="col" className={cn(th, "text-right")}>
            <abbr title="Partidos ganados" className="no-underline">
              PG
            </abbr>
          </th>
          <th scope="col" className={cn(th, "text-right")}>
            Efect.
          </th>
          <th scope="col" className={cn(th, "pr-6 text-right")}>
            Puntos
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {players.map((player, index) => {
          const name = playerName(player);
          return (
            <tr
              key={player.id}
              className="group relative transition-colors hover:bg-muted"
            >
              <td
                className={cn(
                  td,
                  "text-center font-display text-2xl font-bold",
                  index < 3 ? "text-oro-500" : "text-noche-300",
                )}
              >
                {index + 1}
              </td>
              <td className={td}>
                <div className="flex items-center gap-3">
                  <Avatar name={name} src={player.photo_url} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/jugadores/${player.slug}`}
                        className="font-semibold transition-colors group-hover:text-accent after:absolute after:inset-0"
                      >
                        {name}
                      </Link>
                      <ClimbBadge trend={trends?.get(player.id)} />
                    </div>
                    {player.side && (
                      <p className="text-xs text-muted-foreground">
                        {sideLabel(player.side)}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className={cn(td, "text-foreground-soft")}>
                <p>{player.club}</p>
                <p className="text-xs text-muted-foreground">{player.city}</p>
              </td>
              <td className={cn(td, "text-center")}>
                <Badge>{player.category}</Badge>
              </td>
              <td className={cn(td, "text-right text-foreground-soft")}>
                {player.matches_played}
              </td>
              <td className={cn(td, "text-right text-foreground-soft")}>
                {player.matches_won}
              </td>
              <td className={cn(td, "text-right text-foreground-soft")}>
                {effectiveness(player)}%
              </td>
              <td
                className={cn(
                  td,
                  "pr-6 text-right font-display text-2xl leading-none font-bold",
                )}
              >
                {formatNumber(player.ranking_points)}
                <PointsGain
                  trend={trends?.get(player.id)}
                  className="mt-1 font-sans"
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
