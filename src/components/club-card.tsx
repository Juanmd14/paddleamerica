import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { Cover } from "@/components/cover";
import { formatDateRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Club, Tournament } from "@/types/models";

export function courtsLabel(courts: number) {
  return `${courts} ${courts === 1 ? "cancha" : "canchas"}`;
}

/** Tarjeta de club: foto, ciudad, canchas y su próximo torneo si tiene. */
export function ClubCard({
  club,
  nextTournament,
  className,
}: {
  club: Club;
  nextTournament?: Tournament;
  className?: string;
}) {
  return (
    <Link
      href={`/clubes/${club.slug}`}
      className={cn(
        "group block overflow-hidden rounded-card border border-border bg-surface shadow-sm transition-shadow hover:shadow-lg",
        className,
      )}
    >
      <Cover
        src={club.cover_url}
        alt={`Foto de ${club.name}`}
        seed={club.id}
        sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
      />
      <div className="p-5">
        <h3 className="font-display text-2xl leading-none font-bold uppercase transition-colors group-hover:text-accent">
          {club.name}
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          {[club.city, club.courts ? courtsLabel(club.courts) : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {nextTournament ? (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-pista-50 px-3 py-2.5 text-sm text-pista-800">
            <CalendarDays
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span>
              <span className="font-semibold">Próximo torneo:</span>{" "}
              {nextTournament.name} ·{" "}
              {formatDateRange(
                nextTournament.starts_on,
                nextTournament.ends_on,
              )}
            </span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}
