import { ChevronRight, ListOrdered } from "lucide-react";
import Link from "next/link";
import { ClimbBadge, PointsGain } from "@/components/ranking-trend";
import { formatNumber } from "@/lib/format";
import { rankingTitle } from "@/lib/labels";
import type { RankingTrend } from "@/lib/ranking-trends";
import type { Player } from "@/types/models";

/** "Tu lugar en el ranking" en Mi cuenta, para cuentas vinculadas a un jugador. */
export function RankingSpotCard({
  player,
  position,
  trend,
}: {
  player: Player;
  position: number | null;
  trend?: RankingTrend;
}) {
  return (
    <Link
      href={`/jugadores/${player.slug}`}
      className="group flex items-center gap-4 rounded-card border border-border bg-surface p-4 transition-colors hover:border-noche-300 sm:p-5"
    >
      <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg bg-noche-950 text-white">
        {position ? (
          <>
            <span className="text-[0.625rem] leading-none font-semibold text-oro-400 uppercase">
              Puesto
            </span>
            <span className="font-display text-2xl leading-none font-bold tabular-nums">
              {position}
            </span>
          </>
        ) : (
          <ListOrdered className="size-6 text-oro-400" aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">Tu lugar en el ranking</span>
          <ClimbBadge trend={trend} />
        </span>
        <span className="block text-sm text-muted-foreground">
          {position
            ? `Ranking ${rankingTitle(player.category, player.gender)} · ${formatNumber(player.ranking_points)} pts`
            : "Figurás como que ya no competís. Si volvés a jugar, avisale al organizador."}
        </span>
        <PointsGain trend={trend} className="mt-0.5" />
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}
