import { Building2, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader, Table, Td, Th } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/empty-state";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getClubs } from "@/lib/data";

export const metadata: Metadata = { title: "Clubes" };

export default async function AdminClubsPage({
  searchParams,
}: PageProps<"/admin/clubes">) {
  await requireAdmin("/admin/clubes");
  const [clubs, params] = await Promise.all([getClubs(), searchParams]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Clubes"
        description="Las canchas de la zona. Cada club tiene su página con sus próximos torneos."
        actions={
          <ButtonLink href="/admin/clubes/nuevo" size="sm">
            <Plus className="size-4" aria-hidden="true" />
            Nuevo club
          </ButtonLink>
        }
      />
      {params.borrado && <Alert tone="success">Borramos el club.</Alert>}

      {clubs.length > 0 ? (
        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr>
                <Th>Club</Th>
                <Th>Ciudad</Th>
                <Th>Canchas</Th>
              </tr>
            </thead>
            <tbody>
              {clubs.map((club) => (
                <tr key={club.id} className="hover:bg-muted/60">
                  <Td>
                    <Link
                      href={`/admin/clubes/${club.id}`}
                      className="font-semibold hover:text-accent"
                    >
                      {club.name}
                    </Link>
                  </Td>
                  <Td className="text-foreground-soft">{club.city}</Td>
                  <Td className="text-foreground-soft tabular-nums">
                    {club.courts ?? "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={Building2}
          title="Todavía no hay clubes"
          action={
            <ButtonLink href="/admin/clubes/nuevo">
              Cargar el primero
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
