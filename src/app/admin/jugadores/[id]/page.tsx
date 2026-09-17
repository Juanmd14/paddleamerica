import { ExternalLink, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  adjustPlayerPoints,
  deletePlayer,
  updatePlayer,
} from "@/app/admin/jugadores/actions";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { PlayerForm } from "@/components/admin/player-form";
import { PointsAdjuster } from "@/components/admin/points-adjuster";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import {
  getLinkedAccounts,
  getPlayerById,
  getPlayerPointChanges,
} from "@/lib/data";
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

  const [query, history, linkedAccounts] = await Promise.all([
    searchParams,
    getPlayerPointChanges(player.id),
    getLinkedAccounts(),
  ]);
  const account = linkedAccounts.get(player.id);
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

      <Card className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
        <UserRound
          className="size-5 text-muted-foreground"
          aria-hidden="true"
        />
        {account ? (
          <>
            <Avatar
              name={account.full_name || account.username}
              src={account.avatar_url}
              size="sm"
            />
            <p className="min-w-0 flex-1 text-sm">
              Cuenta en el sitio:{" "}
              <Link
                href={`/admin/usuarios/${account.id}`}
                className="font-semibold text-accent hover:underline"
              >
                {account.full_name || account.username} (@{account.username})
              </Link>
              . Si cambiás la categoría o la rama acá, también cambian en su
              cuenta.
            </p>
          </>
        ) : (
          <p className="min-w-0 flex-1 text-sm text-muted-foreground">
            Sin cuenta vinculada. Se vincula desde Panel → Usuarios, en la ficha
            de la cuenta del jugador.
          </p>
        )}
      </Card>

      <PlayerForm
        action={updatePlayer.bind(null, player.id)}
        player={player}
        submitLabel="Guardar cambios"
      />

      <div id="puntos" className="scroll-mt-24">
        <PointsAdjuster
          action={adjustPlayerPoints.bind(null, player.id)}
          points={player.ranking_points}
          history={history}
        />
      </div>

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
