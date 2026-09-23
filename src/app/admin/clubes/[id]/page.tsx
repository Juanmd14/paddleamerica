import { ExternalLink, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deleteClub, updateClub } from "@/app/admin/clubes/actions";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ClubForm } from "@/components/admin/club-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { getClubById } from "@/lib/data";
import { firstParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Editar club" };

export default async function EditClubPage({
  params,
  searchParams,
}: PageProps<"/admin/clubes/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/clubes/${id}`);

  const club = await getClubById(Number(id));
  if (!club) notFound();

  const query = await searchParams;
  const error = firstParam(query.error);
  const saved = firstParam(query.guardado);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Editar club"
        description={club.name}
        actions={
          <ButtonLink
            href={`/clubes/${club.slug}`}
            size="sm"
            variant="ghost"
            target="_blank"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Ver en el sitio
          </ButtonLink>
        }
      />
      {error && <Alert tone="danger">{error}</Alert>}
      {saved && <Alert tone="success">Guardamos el club.</Alert>}

      <ClubForm
        action={updateClub.bind(null, club.id)}
        club={club}
        submitLabel="Guardar cambios"
      />

      <form
        action={deleteClub.bind(null, club.id)}
        className="border-t border-border pt-6"
      >
        <ConfirmSubmitButton
          variant="ghost"
          size="sm"
          className="text-danger hover:bg-danger-soft hover:text-danger"
          confirmMessage="¿Borrar este club? Sus torneos quedan sin club, pero no se borran."
          pendingLabel="Borrando…"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Borrar club
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
