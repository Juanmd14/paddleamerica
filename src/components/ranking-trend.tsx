import { ArrowUp } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { CLIMB_DAYS, GAIN_DAYS, type RankingTrend } from "@/lib/ranking-trends";
import { cn } from "@/lib/utils";

/** Sobre fondo oscuro (Nocturno de vidrio) el verde de success no se lee. */
export const TREND_BADGE = "bg-vidrio-sube/15 text-vidrio-sube";
export const TREND_GAIN = "text-vidrio-sube";

/**
 * Flecha verde con los puestos que subió en la semana. Va a la derecha del nombre.
 * (Si se reemplaza ranking-list o ranking-table, volver a agregar ClimbBadge y PointsGain.)
 */
export function ClimbBadge({
  trend,
  className,
}: {
  trend?: RankingTrend;
  className?: string;
}) {
  if (!trend?.climbed) return null;
  const label = `Subió ${trend.climbed} ${trend.climbed === 1 ? "puesto" : "puestos"} en los últimos ${CLIMB_DAYS} días`;

  return (
    <span
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full bg-success-soft px-1.5 py-0.5 text-xs leading-none font-bold text-success tabular-nums",
        className,
      )}
    >
      <ArrowUp className="size-3.5" strokeWidth={3} aria-hidden="true" />
      {trend.climbed}
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** "+23 último mes" debajo de los puntos. */
export function PointsGain({
  trend,
  compact = false,
  className,
}: {
  trend?: RankingTrend;
  compact?: boolean;
  className?: string;
}) {
  if (!trend?.gained) return null;

  return (
    <p
      title={`Ganó ${formatNumber(trend.gained)} puntos en los últimos ${GAIN_DAYS} días`}
      className={cn(
        "text-xs font-semibold whitespace-nowrap text-success tabular-nums",
        className,
      )}
    >
      +{formatNumber(trend.gained)}
      {!compact && (
        <span className="font-normal text-muted-foreground"> último mes</span>
      )}
    </p>
  );
}
