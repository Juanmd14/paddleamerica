import { Search, Trash2, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { deleteUserAccount } from "@/app/admin/usuarios/actions";
import { AdminPageHeader, Table, Td, Th } from "@/components/admin/admin-ui";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { ProfileCategoryForm } from "@/components/admin/profile-category-form";
import { EmptyState } from "@/components/empty-state";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { getAllProfiles, getRanking } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { firstParam, slugify } from "@/lib/utils";

export const metadata: Metadata = { title: "Usuarios" };

export default async function AdminUsersPage({
  searchParams,
}: PageProps<"/admin/usuarios">) {
  const me = await requireAdmin("/admin/usuarios");
  const params = await searchParams;
  const error = firstParam(params.error);
  const q = firstParam(params.q)?.trim() ?? "";
  // "categoria=sin" queda por los links viejos.
  const filtro =
    firstParam(params.filtro) ??
    (firstParam(params.categoria) === "sin" ? "sin-categoria" : "");

  const [profiles, players] = await Promise.all([
    getAllProfiles(),
    getRanking({ includeInactive: true }),
  ]);
  const playerOf = new Map(
    players
      .filter((player) => player.profile_id)
      .map((player) => [player.profile_id, player]),
  );
  const missing = profiles.filter((profile) => !profile.category).length;
  const outOfRanking = profiles.filter(
    (profile) => !playerOf.has(profile.id),
  ).length;

  // Búsqueda sin tildes por nombre, usuario o email.
  const needle = slugify(q);
  const visible = profiles.filter(
    (profile) =>
      (filtro !== "sin-categoria" || !profile.category) &&
      (filtro !== "sin-ranking" || !playerOf.has(profile.id)) &&
      (!needle ||
        slugify(
          `${profile.full_name ?? ""} ${profile.username} ${profile.email ?? ""}`,
        ).includes(needle)),
  );

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Usuarios"
        description={`Tocá una cuenta para ver su ficha, asignarle categoría o sumarla al ranking con sus puntos.${missing > 0 ? ` ${missing} sin categoría.` : ""}${outOfRanking > 0 ? ` ${outOfRanking} fuera del ranking.` : ""}`}
      />
      {params.borrada && <Alert tone="success">Borramos la cuenta.</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}

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
            placeholder="Buscar por nombre, usuario o email"
            aria-label="Buscar"
            className="pl-9"
          />
        </div>
        <Select
          name="filtro"
          defaultValue={filtro}
          aria-label="Filtrar cuentas"
          className="sm:w-48"
        >
          <option value="">Todas las cuentas</option>
          <option value="sin-categoria">Sin categoría</option>
          <option value="sin-ranking">Fuera del ranking</option>
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
                <Th>Usuario</Th>
                <Th>Contacto</Th>
                <Th>Categoría</Th>
                <Th>Ranking</Th>
                <Th className="text-right">
                  <span className="sr-only">Acciones</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((profile) => {
                const name = profile.full_name || `@${profile.username}`;
                return (
                  <tr key={profile.id} className="align-top">
                    <Td className="min-w-56">
                      <Link
                        href={`/admin/usuarios/${profile.id}`}
                        className="group flex items-center gap-3"
                      >
                        <Avatar
                          name={name}
                          src={profile.avatar_url}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold group-hover:text-accent">
                            {name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{profile.username} · Ver perfil
                          </p>
                        </div>
                      </Link>
                    </Td>
                    <Td className="text-foreground-soft">
                      <p>{profile.email}</p>
                      {profile.phone && (
                        <p className="text-xs text-muted-foreground">
                          {profile.phone}
                        </p>
                      )}
                    </Td>
                    <Td>
                      <ProfileCategoryForm
                        userId={profile.id}
                        name={name}
                        category={profile.category}
                      />
                    </Td>
                    <Td className="whitespace-nowrap">
                      {playerOf.get(profile.id) ? (
                        <Link
                          href={`/admin/jugadores/${playerOf.get(profile.id)!.id}#puntos`}
                          className="font-display text-xl font-bold tabular-nums hover:text-accent"
                        >
                          {formatNumber(
                            playerOf.get(profile.id)!.ranking_points,
                          )}{" "}
                          <span className="font-sans text-xs font-normal text-muted-foreground">
                            pts
                          </span>
                        </Link>
                      ) : (
                        <Link
                          href={`/admin/usuarios/${profile.id}`}
                          className="text-sm font-semibold text-accent hover:text-accent-hover"
                        >
                          Agregar al ranking
                        </Link>
                      )}
                    </Td>
                    <Td className="text-right">
                      {profile.is_admin || profile.id === me.id ? (
                        <Badge tone="primary">Admin</Badge>
                      ) : (
                        <form action={deleteUserAccount.bind(null, profile.id)}>
                          <ConfirmSubmitButton
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:bg-danger-soft hover:text-danger"
                            confirmMessage={`¿Borrar la cuenta de ${name}? También se borran sus inscripciones y avisos. No se puede deshacer.`}
                            pendingLabel="Borrando…"
                            aria-label={`Borrar la cuenta de ${name}`}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            Borrar
                          </ConfirmSubmitButton>
                        </form>
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
          icon={UserRound}
          title={
            profiles.length === 0
              ? "Todavía no hay cuentas"
              : "Ninguna cuenta coincide con la búsqueda"
          }
        />
      )}
    </div>
  );
}
