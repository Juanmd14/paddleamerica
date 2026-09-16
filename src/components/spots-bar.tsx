import type { SpotsInfo } from "@/lib/labels";
import { cn } from "@/lib/utils";

type SpotsBarProps = {
  spots: SpotsInfo;
  /** "dark" para fondos oscuros. */
  tone?: "light" | "dark";
  className?: string;
};

/** "18/24 parejas · Quedan 6 lugares" con barra de progreso. */
export function SpotsBar({ spots, tone = "light", className }: SpotsBarProps) {
  const dark = tone === "dark";
  const almostFull =
    !spots.full && spots.left <= Math.max(2, spots.capacity * 0.2);

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <p
          className={cn(
            "font-display text-3xl leading-none font-bold tabular-nums",
            dark ? "text-white" : "text-foreground",
          )}
        >
          {spots.taken}
          <span className={dark ? "text-noche-400" : "text-muted-foreground"}>
            /{spots.capacity}
          </span>
          <span
            className={cn(
              "ml-2 font-sans text-sm font-medium",
              dark ? "text-noche-300" : "text-muted-foreground",
            )}
          >
            parejas
          </span>
        </p>
        <p
          className={cn(
            "text-sm font-semibold",
            spots.full
              ? "text-danger"
              : almostFull
                ? dark
                  ? "text-oro-400"
                  : "text-oro-700"
                : dark
                  ? "text-noche-200"
                  : "text-success",
          )}
        >
          {spots.full
            ? "Cupo completo"
            : spots.left === 1
              ? "Queda 1 lugar"
              : `Quedan ${spots.left} lugares`}
        </p>
      </div>
      <div
        className={cn(
          "mt-3 h-2.5 overflow-hidden rounded-full",
          dark ? "bg-white/10" : "bg-muted",
        )}
        role="progressbar"
        aria-label="Cupo ocupado"
        aria-valuemin={0}
        aria-valuemax={spots.capacity}
        aria-valuenow={spots.taken}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none",
            spots.full ? "bg-danger" : almostFull ? "bg-oro-400" : "bg-success",
          )}
          style={{ width: `${spots.percent}%` }}
        />
      </div>
    </div>
  );
}
