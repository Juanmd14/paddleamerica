import { CalendarDays, ChevronRight, MapPin, Star, Trophy } from "lucide-react";
import Link from "next/link";
import { Cover } from "@/components/cover";
import { TournamentStatusBadge } from "@/components/tournament-status-badge";
import {
  formatDateRange,
  formatFlyerDate,
  formatShortDate,
} from "@/lib/format";
import { featuredLabel, genderLabel, spotsInfo } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Tournament } from "@/types/models";

type TournamentCardProps = {
  tournament: Tournament;
  /** Parejas anotadas (pendientes + confirmadas), para mostrar los lugares libres. */
  taken?: number;
  className?: string;
};

/** Tarjeta de torneo con el flyer (4:5). Sin flyer, arma uno con la fecha y la sede. */
export function TournamentCard({
  tournament,
  taken = 0,
  className,
}: TournamentCardProps) {
  const isOpen = tournament.status === "inscripciones";
  const spots = spotsInfo(tournament.capacity, taken);
  const chip =
    isOpen && spots
      ? spots.full
        ? "Cupo completo"
        : spots.left === 1
          ? "Queda 1 lugar"
          : `Quedan ${spots.left} lugares`
      : tournament.status === "proximo" && tournament.registration_opens_on
        ? `Abre el ${formatShortDate(tournament.registration_opens_on)}`
        : null;
  const featured = featuredLabel(tournament);

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-card transition-shadow group-hover:shadow-xl",
          isOpen
            ? "shadow-lg ring-2 shadow-oro-400/25 ring-oro-400 group-hover:shadow-oro-400/40"
            : "ring-1 ring-noche-900/5 group-hover:shadow-noche-900/10",
        )}
      >
        <Cover
          src={tournament.cover_url}
          alt={`Flyer de ${tournament.name}`}
          ratio="flyer"
          seed={tournament.id}
          sizes="(min-width: 1024px) 270px, (min-width: 640px) 50vw, 80vw"
          className="transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
          placeholder={<FlyerPlaceholder tournament={tournament} />}
        />
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          <TournamentStatusBadge status={tournament.status} />
          {featured && (
            <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-oro-400 px-2.5 py-1 text-xs font-bold text-noche-950 shadow-sm">
              <Star
                className="size-3 shrink-0 fill-current"
                aria-hidden="true"
              />
              {featured}
            </span>
          )}
          {chip && (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm",
                spots?.full
                  ? "bg-danger text-white"
                  : "bg-white/95 text-noche-950",
              )}
            >
              {chip}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
          {tournament.category} · {genderLabel(tournament.gender)}
        </p>
        <h3 className="mt-1.5 font-display text-2xl leading-none font-bold uppercase transition-colors group-hover:text-accent">
          <Link
            href={`/torneos/${tournament.slug}`}
            className="after:absolute after:inset-0"
          >
            {tournament.name}
          </Link>
        </h3>
        <ul className="mt-3 space-y-1.5 text-sm text-foreground-soft">
          <li className="flex items-center gap-2">
            <CalendarDays
              className="size-4 shrink-0 text-noche-400"
              aria-hidden="true"
            />
            {formatDateRange(tournament.starts_on, tournament.ends_on)}
          </li>
          <li className="flex items-center gap-2">
            <MapPin
              className="size-4 shrink-0 text-noche-400"
              aria-hidden="true"
            />
            {[tournament.venue, tournament.city].filter(Boolean).join(", ")}
          </li>
          {tournament.champions && (
            <li className="flex items-center gap-2 font-medium text-foreground">
              <Trophy
                className="size-4 shrink-0 text-oro-500"
                aria-hidden="true"
              />
              {tournament.champions}
            </li>
          )}
        </ul>
      </div>
    </article>
  );
}

/** Fecha y ciudad sobre el fondo de cancha, para torneos sin flyer. */
export function FlyerPlaceholder({ tournament }: { tournament: Tournament }) {
  const { month, days } = formatFlyerDate(
    tournament.starts_on,
    tournament.ends_on,
  );

  return (
    <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-noche-950/90 via-noche-950/20 to-transparent p-5 text-white">
      <p className="text-xs font-semibold tracking-[0.25em] text-oro-400 uppercase">
        {month}
      </p>
      <p className="mt-1 font-display text-5xl leading-none font-bold uppercase tabular-nums">
        {days}
      </p>
      <p className="mt-2 text-sm font-medium text-noche-200">
        {tournament.city}
      </p>
    </div>
  );
}

/**
 * Tarjeta de un torneo finalizado. Lo primero que se lee es quién ganó;
 * abajo, qué torneo fue y cuándo.
 */
export function TournamentResultCard({
  tournament,
  className,
}: {
  tournament: Tournament;
  className?: string;
}) {
  const champions = tournament.champions
    ?.split("/")
    .map((name) => name.trim())
    .filter(Boolean);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-card bg-surface ring-1 ring-border transition-shadow hover:shadow-xl hover:shadow-noche-900/10",
        className,
      )}
    >
      <div className="bg-noche-950 px-5 pt-5 pb-4 text-white">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-oro-400 uppercase">
          <Trophy className="size-4 shrink-0" aria-hidden="true" />
          {champions?.length === 1 ? "Campeón" : "Campeones"}
        </p>
        {champions?.length ? (
          <p className="mt-2 font-display text-3xl leading-none font-bold uppercase">
            {champions.map((name, index) => (
              <span key={index}>
                {index > 0 && (
                  <>
                    <span className="text-oro-400" aria-hidden="true">
                      {" / "}
                    </span>
                    <span className="sr-only"> y </span>
                  </>
                )}
                {name}
              </span>
            ))}
          </p>
        ) : (
          <p className="mt-2 text-noche-300">Resultado a confirmar</p>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
          {tournament.category} · {genderLabel(tournament.gender)}
        </p>
        <h3 className="mt-1.5 font-display text-2xl leading-none font-bold uppercase transition-colors group-hover:text-accent">
          <Link
            href={`/torneos/${tournament.slug}`}
            className="after:absolute after:inset-0"
          >
            {tournament.name}
          </Link>
        </h3>
        <ul className="mt-3 space-y-1.5 text-sm text-foreground-soft">
          <li className="flex items-center gap-2">
            <CalendarDays
              className="size-4 shrink-0 text-noche-400"
              aria-hidden="true"
            />
            {formatDateRange(tournament.starts_on, tournament.ends_on)}
          </li>
          <li className="flex items-center gap-2">
            <MapPin
              className="size-4 shrink-0 text-noche-400"
              aria-hidden="true"
            />
            {[tournament.venue, tournament.city].filter(Boolean).join(", ")}
          </li>
        </ul>
        <p className="mt-auto flex items-center gap-1 pt-4 text-sm font-semibold text-accent">
          Ver cómo salió
          <ChevronRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </p>
      </div>
    </article>
  );
}
