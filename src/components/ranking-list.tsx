import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { ClimbBadge, PointsGain } from "@/components/ranking-trend";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";
import { playerName, playerPhoto } from "@/lib/labels";
import type { RankingTrend } from "@/lib/ranking-trends";
import { cn } from "@/lib/utils";
import type { Player } from "@/types/models";

type RankingListProps = {
  players: Player[];
  /** Versión reducida para columnas angostas. */
  compact?: boolean;
  /** Puntos del último mes y puestos subidos, por id de jugador. */
  trends?: Map<number, RankingTrend>;
  className?: string;
};

/** Lista de jugadores ordenada; la posición sale del orden del array. */
export function RankingList({
  players,
  compact = false,
  trends,
  className,
}: RankingListProps) {
  return (
    <ol className={cn("divide-y divide-border", className)}>
      {players.map((player, index) => (
        <li key={player.id}>
          <Link
            href={`/jugadores/${player.slug}`}
            className={cn(
              "flex items-center gap-3 transition-colors hover:bg-muted sm:gap-4",
              compact ? "px-4 py-2.5" : "px-4 py-3 sm:px-6",
            )}
          >
            <span
              className={cn(
                "w-7 shrink-0 text-center font-display text-2xl font-bold tabular-nums",
                index < 3 ? "text-oro-500" : "text-noche-300",
              )}
            >
              {index + 1}
            </span>
            <Avatar
              name={playerName(player)}
              src={playerPhoto(player)}
              size={compact ? "sm" : "md"}
            />
            <div className="min-w-0 flex-1">
              <p className="flex min-w-0 items-center gap-2">
                <span className="truncate font-semibold">
                  {playerName(player)}
                </span>
                <ClimbBadge trend={trends?.get(player.id)} />
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {compact
                  ? player.club
                  : [player.club, player.city].filter(Boolean).join(" · ")}
              </p>
            </div>
            {!compact && (
              <Badge className="hidden sm:inline-flex">{player.category}</Badge>
            )}
            <div className="text-right">
              <p
                className={cn(
                  "font-display leading-none font-bold tabular-nums",
                  compact ? "text-lg" : "text-2xl",
                )}
              >
                {formatNumber(player.ranking_points)}
              </p>
              <p className="text-xs text-muted-foreground">pts</p>
              <PointsGain trend={trends?.get(player.id)} compact={compact} />
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
