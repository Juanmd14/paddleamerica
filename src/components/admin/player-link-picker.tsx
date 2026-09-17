"use client";

import { Link2, Search } from "lucide-react";
import { useState } from "react";
import { linkProfilePlayer } from "@/app/admin/usuarios/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { Input } from "@/components/ui/input";
import { categoryFromLabel, categoryName } from "@/lib/categories";
import { formatNumber } from "@/lib/format";
import { branchLabel, genderLabel } from "@/lib/labels";
import { slugify } from "@/lib/utils";

export type LinkablePlayer = {
  id: number;
  name: string;
  gender: string;
  category: string;
  points: number;
  active: boolean;
  /** @usuario de la cuenta que ya lo tiene vinculado (o null). */
  linkedTo: string | null;
};

type Account = {
  userId: string;
  name: string;
  category: number | null;
  gender: string | null;
};

/** Un jugador del ranking con el botón para vincularlo a la cuenta. */
export function PlayerLinkRow({
  player,
  account,
}: {
  player: LinkablePlayer;
  account: Account;
}) {
  const category = categoryFromLabel(player.category);
  const blocked = player.linkedTo
    ? `Ya está vinculado a @${player.linkedTo}.`
    : category === null
      ? `Su categoría “${player.category}” no es de 1ra a 8va: corregila en la ficha del jugador.`
      : null;
  const changes = [
    category !== null &&
      category !== account.category &&
      `categoría ${account.category ? categoryName(account.category) : "sin asignar"} → ${categoryName(category)}`,
    player.gender !== account.gender &&
      `rama ${account.gender ? genderLabel(account.gender).toLowerCase() : "sin elegir"} → ${genderLabel(player.gender).toLowerCase()}`,
  ].filter((change) => typeof change === "string");

  return (
    <li className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{player.name}</p>
          <p className="text-xs text-muted-foreground">
            {branchLabel(player.gender)} · {player.category} ·{" "}
            {formatNumber(player.points)} pts
            {!player.active && " · ya no compite"}
          </p>
        </div>
        {!blocked && (
          <form
            action={linkProfilePlayer.bind(null, account.userId, player.id)}
          >
            <ConfirmSubmitButton
              size="sm"
              variant="outline"
              pendingLabel="Vinculando…"
              confirmMessage={`¿Vincular la cuenta de ${account.name} con ${player.name} del ranking? La categoría y la rama de la cuenta van a salir de este jugador${changes.length > 0 ? ` (${changes.join(", ")})` : ""}.`}
            >
              <Link2 className="size-4" aria-hidden="true" />
              Vincular
            </ConfirmSubmitButton>
          </form>
        )}
      </div>
      {blocked ? (
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          {blocked}
        </p>
      ) : (
        changes.length > 0 && (
          <p className="mt-2 text-xs font-medium text-oro-800">
            Al vincular cambia: {changes.join(" y ")}.
          </p>
        )
      )}
    </li>
  );
}

/** Buscador de cualquier jugador del ranking para vincular a la cuenta. */
export function PlayerLinkPicker({
  account,
  players,
}: {
  account: Account;
  players: LinkablePlayer[];
}) {
  const [query, setQuery] = useState("");
  const term = slugify(query);
  const results =
    term.length >= 2
      ? players
          .filter((player) => slugify(player.name).includes(term))
          .slice(0, 8)
      : [];

  return (
    <div>
      <label
        htmlFor={`buscar-jugador-${account.userId}`}
        className="text-sm font-medium text-foreground-soft"
      >
        Buscar otro jugador
      </label>
      <div className="relative mt-1.5">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id={`buscar-jugador-${account.userId}`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nombre o apellido"
          autoComplete="off"
          className="pl-9"
        />
      </div>
      {term.length >= 2 &&
        (results.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {results.map((player) => (
              <PlayerLinkRow
                key={player.id}
                player={player}
                account={account}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No hay jugadores con ese nombre en el ranking.
          </p>
        ))}
    </div>
  );
}
