import { tournamentStatus } from "@/lib/labels";
import { cn } from "@/lib/utils";

const styles: Record<string, { badge: string; dot?: string }> = {
  inscripciones: { badge: "bg-success text-white", dot: "bg-white" },
  proximo: { badge: "bg-pista-600 text-white" },
  en_juego: { badge: "bg-oro-400 text-noche-950", dot: "bg-noche-950" },
  finalizado: { badge: "bg-noche-700 text-white" },
};

/** Estado del torneo con color sólido (sitio público). Las abiertas y en juego llevan un punto titilando. */
export function TournamentStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const { label } = tournamentStatus(status);
  const style = styles[status] ?? styles.finalizado;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap shadow-sm",
        style.badge,
        className,
      )}
    >
      {style.dot && (
        <span className="relative flex size-2" aria-hidden="true">
          <span
            className={cn(
              "absolute inline-flex size-full animate-ping rounded-full opacity-75 motion-reduce:animate-none",
              style.dot,
            )}
          />
          <span
            className={cn(
              "relative inline-flex size-2 rounded-full",
              style.dot,
            )}
          />
        </span>
      )}
      {label}
    </span>
  );
}
