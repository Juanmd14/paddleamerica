import { CalendarDays, MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import { Cover } from "@/components/cover";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateRange } from "@/lib/format";
import { genderLabel, tournamentStatus } from "@/lib/labels";
import type { Tournament } from "@/types/models";

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  const status = tournamentStatus(tournament.status);

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-xl hover:shadow-noche-900/5">
      <Link
        href={`/torneos/${tournament.slug}`}
        className="flex h-full flex-col"
      >
        <Cover
          src={tournament.cover_url}
          alt=""
          sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
        />
        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone={status.tone}>{status.label}</Badge>
            <Badge>{genderLabel(tournament.gender)}</Badge>
          </div>
          <h3 className="mt-3 font-display text-2xl leading-tight font-bold uppercase transition-colors group-hover:text-accent">
            {tournament.name}
          </h3>
          <p className="text-sm font-medium text-muted-foreground">
            {tournament.category}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-noche-600">
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
                Campeones: {tournament.champions}
              </li>
            )}
          </ul>
        </div>
      </Link>
    </Card>
  );
}
