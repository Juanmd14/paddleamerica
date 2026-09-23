import { ClipboardList, ExternalLink, Plus, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader, Table, Td, Th } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/empty-state";
import { TournamentStatusBadge } from "@/components/tournament-status-badge";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireClubOwner } from "@/lib/auth";
import { getMyClubs, getMyClubTournaments } from "@/lib/data";
import { formatDateRange } from "@/lib/format";

export const metadata: Metadata = { title: "Torneos" };

export default async function ClubPanelPage({
  searchParams,
}: PageProps<"/mi-club">) {
  await requireClubOwner("/mi-club");
  const [clubs, tournaments, params] = await Promise.all([
    getMyClubs(),
    getMyClubTournaments(),
    searchParams,
  ]);
  const clubName = new Map(clubs.map((club) => [club.id, club.name]));

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={clubs.length === 1 ? clubs[0].name : "Mis clubes"}
        description="Creá los torneos del club y confirmá a las parejas que se anotan."
        actions={
          <>
            {clubs.length === 1 && (
              <ButtonLink
                href={`/clubes/${clubs[0].slug}`}
                size="sm"
                variant="ghost"
                target="_blank"
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                Ver el club
              </ButtonLink>
            )}
            <ButtonLink href="/mi-club/torneos/nuevo" size="sm">
              <Plus className="size-4" aria-hidden="true" />
              Nuevo torneo
            </ButtonLink>
          </>
        }
      />
      {params.borrado && <Alert tone="success">Borramos el torneo.</Alert>}

      {tournaments.length > 0 ? (
        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr>
                <Th>Torneo</Th>
                <Th>Fechas</Th>
                <Th>Estado</Th>
                <Th className="text-right">Inscripciones</Th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((tournament) => (
                <tr key={tournament.id} className="hover:bg-muted/60">
                  <Td>
                    <Link
                      href={`/mi-club/torneos/${tournament.id}`}
                      className="font-semibold hover:text-accent"
                    >
                      {tournament.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {tournament.category}
                      {clubs.length > 1 &&
                        tournament.club_id &&
                        ` · ${clubName.get(tournament.club_id)}`}
                    </p>
                  </Td>
                  <Td className="whitespace-nowrap text-foreground-soft">
                    {formatDateRange(tournament.starts_on, tournament.ends_on)}
                  </Td>
                  <Td>
                    <TournamentStatusBadge status={tournament.status} />
                  </Td>
                  <Td className="text-right">
                    <Link
                      href={`/mi-club/torneos/${tournament.id}/inscripciones`}
                      className="inline-flex items-center gap-2 font-semibold text-accent hover:text-accent-hover"
                    >
                      <ClipboardList className="size-4" aria-hidden="true" />
                      {tournament.registrations}
                      {tournament.pending > 0 && (
                        <Badge tone="primary">
                          {tournament.pending} para confirmar
                        </Badge>
                      )}
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={Trophy}
          title="Todavía no hay torneos en tu club"
          action={
            <ButtonLink href="/mi-club/torneos/nuevo">
              Crear el primero
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
