import { ClipboardCheck, ExternalLink, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  deleteClubTournament,
  updateClubTournament,
} from "@/app/mi-club/actions";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { TournamentForm } from "@/components/admin/tournament-form";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { requireClubOwner } from "@/lib/auth";
import {
  getClubRegistrations,
  getMyClubs,
  getTournamentById,
} from "@/lib/data";
import { firstParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Editar torneo" };

export default async function EditClubTournamentPage({
  params,
  searchParams,
}: PageProps<"/mi-club/torneos/[id]">) {
  const { id } = await params;
  const tournament = await getTournamentById(Number(id));
  // Si no es de uno de sus clubes, 404 (igual que si no existiera).
  const user = await requireClubOwner(
    `/mi-club/torneos/${id}`,
    tournament?.club_id ?? null,
  );
  if (!tournament) notFound();

  const [clubs, registrations, query] = await Promise.all([
    getMyClubs(),
    getClubRegistrations(tournament.id),
    searchParams,
  ]);
  const error = firstParam(query.error);
  const saved = firstParam(query.guardado);
  const taken = registrations.filter(
    (registration) =>
      registration.status === "pendiente" ||
      registration.status === "confirmada",
  ).length;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Editar torneo"
        description={tournament.name}
        actions={
          <>
            <ButtonLink
              href={`/mi-club/torneos/${tournament.id}/inscripciones`}
              size="sm"
              variant="outline"
            >
              <ClipboardCheck className="size-4" aria-hidden="true" />
              Inscripciones ({registrations.length})
            </ButtonLink>
            <ButtonLink
              href={`/torneos/${tournament.slug}`}
              size="sm"
              variant="ghost"
              target="_blank"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              Ver en el sitio
            </ButtonLink>
          </>
        }
      />
      {error && <Alert tone="danger">{error}</Alert>}
      {saved && <Alert tone="success">Guardamos el torneo.</Alert>}

      <TournamentForm
        action={updateClubTournament.bind(null, tournament.id)}
        tournament={tournament}
        taken={taken}
        clubs={clubs}
        clubOwnerId={user.id}
        submitLabel="Guardar cambios"
      />

      {registrations.length === 0 && (
        <form
          action={deleteClubTournament.bind(null, tournament.id)}
          className="border-t border-border pt-6"
        >
          <ConfirmSubmitButton
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger-soft hover:text-danger"
            confirmMessage="¿Borrar este torneo? No se puede deshacer."
            pendingLabel="Borrando…"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Borrar torneo
          </ConfirmSubmitButton>
        </form>
      )}
    </div>
  );
}
