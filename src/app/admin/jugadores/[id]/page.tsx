import { ExternalLink, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deletePlayer, updatePlayer } from "@/app/admin/jugadores/actions";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { PlayerForm } from "@/components/admin/player-form";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { getPlayerById } from "@/lib/data";
import { playerName } from "@/lib/labels";
import { firstParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Editar jugador" };

export default async function EditPlayerPage({
  params,
  searchParams,
}: PageProps<"/admin/jugadores/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/jugadores/${id}`);

  const player = await getPlayerById(Number(id));
  if (!player) notFound();

  const query = await searchParams;
  const error = firstParam(query.error);
  const saved = firstParam(query.guardado);
  const name = playerName(player);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={name}
        actions={
          <ButtonLink
            href={`/jugadores/${player.slug}`}
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
      {saved && <Alert tone="success">Creamos el jugador.</Alert>}

      <PlayerForm
        action={updatePlayer.bind(null, player.id)}
        player={player}
        submitLabel="Guardar cambios"
      />

      <form
        action={deletePlayer.bind(null, player.id)}
        className="border-t border-border pt-6"
      >
        <ConfirmSubmitButton
          variant="ghost"
          size="sm"
          className="text-danger hover:bg-danger-soft hover:text-danger"
          confirmMessage={`¿Borrar a ${name} del ranking? No se puede deshacer.`}
          pendingLabel="Borrando…"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Borrar jugador
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
