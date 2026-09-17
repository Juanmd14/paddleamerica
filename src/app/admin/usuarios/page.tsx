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
import { genderLabel } from "@/lib/labels";
import { getAllProfiles } from "@/lib/data";
import { firstParam, slugify } from "@/lib/utils";

export const metadata: Metadata = { title: "Usuarios" };

export default async function AdminUsersPage({
  searchParams,
}: PageProps<"/admin/usuarios">) {
  const me = await requireAdmin("/admin/usuarios");
  const params = await searchParams;
  const error = firstParam(params.error);
  const q = firstParam(params.q)?.trim() ?? "";
  const onlyMissing = firstParam(params.categoria) === "sin";

  const profiles = await getAllProfiles();
  const missing = profiles.filter((profile) => !profile.category).length;

  // Búsqueda sin tildes por nombre, usuario o email.
  const needle = slugify(q);
  const visible = profiles.filter(
    (profile) =>
      (!onlyMissing || !profile.category) &&
      (!needle ||
        slugify(
          `${profile.full_name ?? ""} ${profile.username} ${profile.email ?? ""}`,
        ).includes(needle)),
  );

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Usuarios"
        description={`La categoría de cada jugador la asignás vos: define en qué torneos se puede anotar.${missing > 0 ? ` ${missing} ${missing === 1 ? "cuenta no tiene" : "cuentas no tienen"} categoría.` : ""}`}
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
          name="categoria"
          defaultValue={onlyMissing ? "sin" : ""}
          aria-label="Categoría"
          className="sm:w-48"
        >
          <option value="">Todas las cuentas</option>
          <option value="sin">Sin categoría</option>
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
                      <p
                        className={
                          profile.gender
                            ? "mt-1.5 text-xs text-muted-foreground"
                            : "mt-1.5 text-xs font-medium text-oro-800"
                        }
                      >
                        {profile.gender
                          ? genderLabel(profile.gender)
                          : "Sin rama"}
                      </p>
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
