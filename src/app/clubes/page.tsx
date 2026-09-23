import { Building2 } from "lucide-react";
import type { Metadata } from "next";
import { ClubCard } from "@/components/club-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Container } from "@/components/ui/container";
import { getClubs, getNextTournamentByClub } from "@/lib/data";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Clubes",
  description: `Los clubes y canchas de pádel de ${siteConfig.region}: dónde quedan, cuántas canchas tienen y sus próximos torneos.`,
};

export default async function ClubsPage() {
  const [clubs, nextByClub] = await Promise.all([
    getClubs(),
    getNextTournamentByClub(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Dónde se juega"
        title="Clubes"
        description="Todos los clubes de la zona."
      />

      <Container className="py-12 sm:py-16">
        {clubs.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                nextTournament={nextByClub.get(club.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title="Todavía no hay clubes cargados"
            description="Muy pronto vas a encontrar acá todas las canchas de la zona."
          />
        )}
      </Container>
    </>
  );
}
