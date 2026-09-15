import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";
import { TournamentCard } from "@/components/tournament-card";
import { Container } from "@/components/ui/container";
import { getTournaments } from "@/lib/data";
import type { Tournament } from "@/types/models";

export const metadata: Metadata = {
  title: "Torneos",
};

export default async function TournamentsPage() {
  const [upcoming, finished] = await Promise.all([
    getTournaments(),
    getTournaments({ finished: true }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Circuito regional"
        title="Torneos"
        description="Calendario de la temporada, inscripciones abiertas y resultados de los torneos jugados."
      />

      <Container className="space-y-16 py-12 sm:py-16">
        <section>
          <SectionHeading title="Próximos" />
          <TournamentGrid
            tournaments={upcoming}
            emptyTitle="No hay torneos programados"
          />
        </section>
        <section>
          <SectionHeading title="Finalizados" />
          <TournamentGrid
            tournaments={finished}
            emptyTitle="Todavía no se jugó ningún torneo"
          />
        </section>
      </Container>
    </>
  );
}

function TournamentGrid({
  tournaments,
  emptyTitle,
}: {
  tournaments: Tournament[];
  emptyTitle: string;
}) {
  if (tournaments.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState title={emptyTitle} />
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {tournaments.map((tournament) => (
        <TournamentCard key={tournament.id} tournament={tournament} />
      ))}
    </div>
  );
}
