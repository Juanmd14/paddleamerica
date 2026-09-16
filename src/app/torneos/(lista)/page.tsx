import { ChevronRight, History, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";
import { TournamentCard } from "@/components/tournament-card";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getTournamentSpots, getTournaments } from "@/lib/data";
import { formatDateRange } from "@/lib/format";
import { genderLabel } from "@/lib/labels";
import type { Tournament } from "@/types/models";

export const metadata: Metadata = {
  title: "Torneos",
  description:
    "Calendario de torneos de pádel de la zona: inscripciones abiertas, próximas fechas y campeones.",
};

export default async function TournamentsPage() {
  const [upcoming, finished, spots] = await Promise.all([
    getTournaments(),
    getTournaments({ finished: true }),
    getTournamentSpots(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Circuito regional"
        title="Torneos"
        description="Calendario de la temporada, inscripciones abiertas y resultados de los torneos jugados."
      />

      <Container className="space-y-20 py-12 sm:py-16">
        <section>
          <SectionHeading title="Próximos" />
          {upcoming.length > 0 ? (
            <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {upcoming.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  taken={spots.get(tournament.id)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                icon={Trophy}
                title="No hay torneos programados"
                description="Apenas se confirme la próxima fecha la vas a ver acá."
              />
            </div>
          )}
        </section>

        <section>
          <SectionHeading title="Resultados" />
          {finished.length > 0 ? (
            <Card className="mt-8 overflow-hidden">
              <ul className="divide-y divide-border">
                {finished.map((tournament) => (
                  <ResultRow key={tournament.id} tournament={tournament} />
                ))}
              </ul>
            </Card>
          ) : (
            <div className="mt-8">
              <EmptyState
                icon={History}
                title="Todavía no se jugó ningún torneo"
              />
            </div>
          )}
        </section>
      </Container>
    </>
  );
}

function ResultRow({ tournament }: { tournament: Tournament }) {
  return (
    <li>
      <Link
        href={`/torneos/${tournament.slug}`}
        className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted sm:px-6"
      >
        <div className="grid min-w-0 flex-1 gap-1 sm:grid-cols-[1.4fr_1fr_1fr] sm:items-center sm:gap-6">
          <div className="min-w-0">
            <p className="font-display text-xl leading-tight font-bold uppercase transition-colors group-hover:text-accent">
              {tournament.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDateRange(tournament.starts_on, tournament.ends_on)}
            </p>
          </div>
          <p className="text-sm text-foreground-soft">
            {tournament.city} · {tournament.category} ·{" "}
            {genderLabel(tournament.gender)}
          </p>
          {tournament.champions && (
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Trophy
                className="size-4 shrink-0 text-oro-500"
                aria-hidden="true"
              />
              <span className="sr-only">Campeones:</span>
              {tournament.champions}
            </p>
          )}
        </div>
        <ChevronRight
          className="size-5 shrink-0 text-noche-300 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}
