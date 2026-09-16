import type { Player } from "@/types/models";

const DAY = 24 * 60 * 60 * 1000;
/** Los puntos ganados se suman en esta ventana ("+23 en el último mes"). */
export const GAIN_DAYS = 30;
/** La flecha de puestos subidos dura esto desde el cambio. */
export const CLIMB_DAYS = 7;

export type PointChange = {
  player_id: number;
  delta: number;
  created_at: string;
};

export type RankingTrend = {
  /** Puntos ganados en los últimos 30 días (solo si es positivo). */
  gained: number;
  /** Puestos que subió respecto de hace 7 días (solo si subió). */
  climbed: number;
};

/** Puesto con empates: 1 + cuántos tienen más puntos. */
function rankOf(points: number, all: number[]) {
  return 1 + all.filter((other) => other > points).length;
}

/**
 * Tendencia de cada jugador dentro de la lista que se muestra (una rama o una
 * categoría). El puesto de hace 7 días sale de restar los cambios de la semana.
 */
export function rankingTrends(
  players: Pick<Player, "id" | "ranking_points" | "created_at">[],
  changes: PointChange[],
  now = Date.now(),
): Map<number, RankingTrend> {
  const gainSince = now - GAIN_DAYS * DAY;
  const climbSince = now - CLIMB_DAYS * DAY;

  const gained = new Map<number, number>();
  const weekDelta = new Map<number, number>();
  for (const change of changes) {
    const time = Date.parse(change.created_at);
    if (time >= gainSince) {
      gained.set(
        change.player_id,
        (gained.get(change.player_id) ?? 0) + change.delta,
      );
    }
    if (time >= climbSince) {
      weekDelta.set(
        change.player_id,
        (weekDelta.get(change.player_id) ?? 0) + change.delta,
      );
    }
  }

  // Se compara solo entre los que ya estaban hace 7 días: los puestos subidos
  // son los jugadores que pasó (un jugador nuevo arriba no le resta).
  const before = players.filter(
    (player) => Date.parse(player.created_at) < climbSince,
  );
  const pastPointsOf = (player: (typeof players)[number]) =>
    player.ranking_points - (weekDelta.get(player.id) ?? 0);
  const pastPoints = before.map(pastPointsOf);
  const currentPoints = before.map((player) => player.ranking_points);
  const climbedBy = new Map(
    before.map((player) => [
      player.id,
      rankOf(pastPointsOf(player), pastPoints) -
        rankOf(player.ranking_points, currentPoints),
    ]),
  );

  const trends = new Map<number, RankingTrend>();
  for (const player of players) {
    const climbed = Math.max(0, climbedBy.get(player.id) ?? 0);
    const gain = Math.max(0, gained.get(player.id) ?? 0);
    if (climbed > 0 || gain > 0) {
      trends.set(player.id, { gained: gain, climbed });
    }
  }
  return trends;
}
