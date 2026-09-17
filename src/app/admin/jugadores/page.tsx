import { FileSpreadsheet, Plus, Search, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader, Table, Td, Th } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/empty-state";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { getRanking, getRankingCategories } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { genderLabel, playerGenderOptions, playerName } from "@/lib/labels";
import { cn, firstParam, slugify } from "@/lib/utils";

export const metadata: Metadata = { title: "Jugadores" };

export default async function AdminPlayersPage({
  searchParams,
}: PageProps<"/admin/jugadores">) {
  await requireAdmin("/admin/jugadores");
  const params = await searchParams;
  const q = firstParam(params.q)?.trim() ?? "";
  const rama = firstParam(params.rama);
  const gender = playerGenderOptions.some((option) => option.value === rama)
    ? rama
    : undefined;

  const estado = firstParam(params.estado);
  const [players, men, women] = await Promise.all([
    getRanking({ gender, includeInactive: true }),
    getRankingCategories("masculino"),
    getRankingCategories("femenino"),
  ]);
  const categories = [...new Set([...men, ...women])];
  const categoria = firstParam(params.categoria);
  const category = categories.includes(categoria ?? "") ? categoria : undefined;

  // Búsqueda sin tildes por nombre, club o ciudad.
  const needle = slugify(q);
  const visible = players.filter(
    (player) =>
      (!category || player.category === category) &&
      (estado === "inactivos"
        ? !player.active
        : estado === "activos"
          ? player.active
          : true) &&
      (!needle ||
        slugify(
          `${player.first_name} ${player.last_name} ${player.club ?? ""} ${player.city ?? ""}`,
        ).includes(needle)),
  );

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Jugadores"
        description="Ordenados por puntos. Para corregirle los puntos a uno, tocá “Corregir”; para actualizar muchos a la vez, usá la carga desde Excel."
        actions={
          <>
            <ButtonLink href="/admin/puntos" size="sm" variant="outline">
              <FileSpreadsheet className="size-4" aria-hidden="true" />
              Cargar puntos
            </ButtonLink>
            <ButtonLink href="/admin/jugadores/nuevo" size="sm">
              <Plus className="size-4" aria-hidden="true" />
              Nuevo jugador
            </ButtonLink>
          </>
        }
      />
      {params.borrado && <Alert tone="success">Borramos el jugador.</Alert>}

      <form className="flex flex-col gap-3 sm:flex-row" role="search">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Buscar por nombre, club o ciudad"
            aria-label="Buscar"
            className="pl-9"
          />
        </div>
        <Select
          name="rama"
          defaultValue={gender ?? ""}
          aria-label="Rama"
          className="sm:w-40"
        >
          <option value="">Todas las ramas</option>
          {playerGenderOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          name="categoria"
          defaultValue={category ?? ""}
          aria-label="Categoría"
          className="sm:w-44"
        >
          <option value="">Todas las categorías</option>
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <Select
          name="estado"
          defaultValue={estado ?? ""}
          aria-label="Estado"
          className="sm:w-44"
        >
          <option value="">Todos</option>
          <option value="activos">Compiten</option>
          <option value="inactivos">Ya no compiten</option>
        </Select>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      {visible.length > 0 ? (
        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr>
                <Th>Jugador</Th>
                <Th>Rama</Th>
                <Th>Cat.</Th>
                <Th>Club</Th>
                <Th className="text-right">Puntos</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((player) => {
                const name = playerName(player);
                return (
                  <tr
                    key={player.id}
                    className={cn(
                      "hover:bg-muted/60",
                      !player.active && "text-muted-foreground",
                    )}
                  >
                    <Td>
                      <Link
                        href={`/admin/jugadores/${player.id}`}
                        className="flex items-center gap-3 font-semibold hover:text-accent"
                      >
                        <Avatar
                          name={name}
                          src={player.photo_url}
                          size="sm"
                          className={cn(!player.active && "opacity-50")}
                        />
                        {name}
                        {!player.active && <Badge>Ya no compite</Badge>}
                      </Link>
                    </Td>
                    <Td className="text-foreground-soft">
                      {genderLabel(player.gender)}
                    </Td>
                    <Td>
                      <Badge>{player.category}</Badge>
                    </Td>
                    <Td className="text-foreground-soft">
                      {[player.club, player.city].filter(Boolean).join(" · ")}
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      <span className="block font-display text-xl leading-none font-bold tabular-nums">
                        {formatNumber(player.ranking_points)}
                      </span>
                      <Link
                        href={`/admin/jugadores/${player.id}#puntos`}
                        className="text-xs font-semibold text-accent hover:text-accent-hover"
                      >
                        Corregir
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={Users}
          title={
            players.length === 0
              ? "Todavía no hay jugadores"
              : "Ningún jugador coincide con la búsqueda"
          }
          action={
            players.length === 0 && (
              <ButtonLink href="/admin/puntos">
                Cargarlos desde Excel
              </ButtonLink>
            )
          }
        />
      )}
    </div>
  );
}
