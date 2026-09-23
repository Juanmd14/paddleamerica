import { ExternalLink, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  addClubOwner,
  deleteClub,
  removeClubOwner,
  updateClub,
} from "@/app/admin/clubes/actions";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ClubForm } from "@/components/admin/club-form";
import { ClubOwnerForm } from "@/components/admin/club-owner-form";
import { ClubAlbumManager } from "@/components/club-album-manager";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import {
  getClubById,
  getClubOwners,
  getClubPhotos,
  getClubTournaments,
} from "@/lib/data";
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

  const [owners, photos, { upcoming, finished }, query] = await Promise.all([
    getClubOwners(club.id),
    getClubPhotos(club.id),
    getClubTournaments(club.id),
    searchParams,
  ]);
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

      <Card className="space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="font-display text-2xl font-bold uppercase">
            Dueños del club
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Desde “Mi club” pueden crear y editar los torneos de este club y
            confirmar o rechazar a las parejas. Ven el nombre, el usuario, la
            categoría y la rama de los jugadores y el teléfono que dejaron al
            anotarse (para escribirles), pero no emails, y no entran al panel.
          </p>
        </div>
        {owners.length > 0 && (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {owners.map((owner) => (
              <li
                key={owner.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <Link
                  href={`/admin/usuarios/${owner.id}`}
                  className="min-w-0 hover:text-accent"
                >
                  <span className="block truncate font-semibold">
                    {owner.full_name || `@${owner.username}`}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    @{owner.username} · {owner.email}
                  </span>
                </Link>
                <form action={removeClubOwner.bind(null, club.id, owner.id)}>
                  <ConfirmSubmitButton
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger-soft hover:text-danger"
                    confirmMessage={`¿Sacarle el club a @${owner.username}? Los torneos que creó quedan.`}
                    pendingLabel="Sacando…"
                  >
                    Sacar
                  </ConfirmSubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
        <ClubOwnerForm action={addClubOwner.bind(null, club.id)} />
      </Card>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold uppercase">
          Álbum del club
        </h2>
        <ClubAlbumManager
          clubId={club.id}
          photos={photos}
          tournaments={[...upcoming, ...finished]}
        />
      </section>

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
