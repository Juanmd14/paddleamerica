import { History, Trophy } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";
import {
  TournamentCard,
  TournamentResultRow,
} from "@/components/tournament-card";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getTournamentSpots, getTournaments } from "@/lib/data";

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
                  <TournamentResultRow
                    key={tournament.id}
                    tournament={tournament}
                  />
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
