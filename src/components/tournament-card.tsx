import { CalendarDays, MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import { Cover } from "@/components/cover";
import { Badge } from "@/components/ui/badge";
import { formatDateRange, formatFlyerDate } from "@/lib/format";
import { genderLabel, tournamentStatus } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Tournament } from "@/types/models";

type TournamentCardProps = {
  tournament: Tournament;
  className?: string;
};

/** Tarjeta de torneo con el flyer (4:5). Sin flyer, arma uno con la fecha y la sede. */
export function TournamentCard({ tournament, className }: TournamentCardProps) {
  const status = tournamentStatus(tournament.status);

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative overflow-hidden rounded-card ring-1 ring-noche-900/5 transition-shadow group-hover:shadow-xl group-hover:shadow-noche-900/10">
        <Cover
          src={tournament.cover_url}
          alt={`Flyer de ${tournament.name}`}
          ratio="flyer"
          seed={tournament.id}
          sizes="(min-width: 1024px) 270px, (min-width: 640px) 50vw, 80vw"
          className="transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
          placeholder={<FlyerPlaceholder tournament={tournament} />}
        />
        <Badge tone={status.tone} className="absolute top-3 left-3 shadow-sm">
          {status.label}
        </Badge>
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
