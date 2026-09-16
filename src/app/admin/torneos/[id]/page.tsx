import { ClipboardCheck, ExternalLink, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  deleteTournament,
  updateTournament,
} from "@/app/admin/torneos/actions";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { TournamentForm } from "@/components/admin/tournament-form";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { getTournamentById, getTournamentSpots } from "@/lib/data";
import { firstParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Editar torneo" };

export default async function EditTournamentPage({
  params,
  searchParams,
}: PageProps<"/admin/torneos/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/torneos/${id}`);

  const tournamentId = Number(id);
  const tournament = Number.isInteger(tournamentId)
    ? await getTournamentById(tournamentId)
    : null;
  if (!tournament) notFound();

  const [query, spots] = await Promise.all([
    searchParams,
    getTournamentSpots(),
  ]);
  const error = firstParam(query.error);
  const saved = firstParam(query.guardado);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={tournament.name}
        actions={
          <>
            <ButtonLink
              href={`/admin/torneos/${tournament.id}/inscripciones`}
              size="sm"
              variant="outline"
            >
              <ClipboardCheck className="size-4" aria-hidden="true" />
              Inscripciones
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
      {saved && <Alert tone="success">Creamos el torneo.</Alert>}

      <TournamentForm
        action={updateTournament.bind(null, tournament.id)}
        tournament={tournament}
        taken={spots.get(tournament.id)}
        submitLabel="Guardar cambios"
      />

      <form
        action={deleteTournament.bind(null, tournament.id)}
        className="border-t border-border pt-6"
      >
        <ConfirmSubmitButton
          variant="ghost"
          size="sm"
          className="text-danger hover:bg-danger-soft hover:text-danger"
          confirmMessage={`¿Borrar "${tournament.name}"? No se puede deshacer.`}
          pendingLabel="Borrando…"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Borrar torneo
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
