import { Plus, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader, Table, Td, Th } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/empty-state";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getAllTournaments } from "@/lib/data";
import { formatDateRange } from "@/lib/format";
import { genderLabel, tournamentStatus } from "@/lib/labels";

export const metadata: Metadata = { title: "Torneos" };

export default async function AdminTournamentsPage({
  searchParams,
}: PageProps<"/admin/torneos">) {
  await requireAdmin("/admin/torneos");
  const [tournaments, params] = await Promise.all([
    getAllTournaments(),
    searchParams,
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Torneos"
        description="Los próximos arriba. Tocá un torneo para editarlo o ver sus inscripciones."
        actions={
          <ButtonLink href="/admin/torneos/nuevo" size="sm">
            <Plus className="size-4" aria-hidden="true" />
            Nuevo torneo
          </ButtonLink>
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
              {tournaments.map((tournament) => {
                const status = tournamentStatus(tournament.status);
                return (
                  <tr key={tournament.id} className="hover:bg-muted/60">
                    <Td>
                      <Link
                        href={`/admin/torneos/${tournament.id}`}
                        className="font-semibold hover:text-accent"
                      >
                        {tournament.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {tournament.category} · {genderLabel(tournament.gender)}{" "}
                        · {tournament.city}
                      </p>
                    </Td>
                    <Td className="whitespace-nowrap text-foreground-soft">
                      {formatDateRange(
                        tournament.starts_on,
                        tournament.ends_on,
                      )}
                    </Td>
                    <Td>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      <Link
                        href={`/admin/torneos/${tournament.id}/inscripciones`}
                        className="font-semibold text-accent tabular-nums hover:text-accent-hover"
                      >
                        {tournament.registrations}
                      </Link>
                      {tournament.pending > 0 && (
                        <span className="ml-2 rounded-full bg-oro-100 px-2 py-0.5 text-xs font-semibold text-oro-800">
                          {tournament.pending} pendientes
                        </span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={Trophy}
          title="Todavía no hay torneos"
          action={
            <ButtonLink href="/admin/torneos/nuevo">
              Crear el primero
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
