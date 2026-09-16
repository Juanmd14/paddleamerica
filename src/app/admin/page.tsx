import {
  ClipboardCheck,
  FileSpreadsheet,
  Newspaper,
  Plus,
  Trophy,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboard } from "@/lib/data";
import { formatDate, formatDateRange, formatNumber } from "@/lib/format";
import { tournamentStatus } from "@/lib/labels";

export const metadata: Metadata = { title: "Resumen" };

export default async function AdminHomePage() {
  const user = await requireAdmin();
  const { pendingRegistrations, upcoming, counts, lastImport } =
    await getAdminDashboard();

  const stats = [
    {
      label: "Inscripciones pendientes",
      value: pendingRegistrations,
      icon: ClipboardCheck,
      highlight: pendingRegistrations > 0,
    },
    { label: "Torneos", value: counts.tournaments, icon: Trophy },
    { label: "Noticias", value: counts.news, icon: Newspaper },
    { label: "Jugadores", value: counts.players, icon: Users },
  ];

  return (
    <div className="space-y-10">
      <AdminPageHeader
        title={`Hola, ${user.name.split(" ")[0]}`}
        description="Desde acá cargás torneos, noticias y jugadores, y confirmás las inscripciones."
        actions={
          <>
            <ButtonLink href="/admin/torneos/nuevo" size="sm">
              <Plus className="size-4" aria-hidden="true" />
              Torneo
            </ButtonLink>
            <ButtonLink
              href="/admin/noticias/nueva"
              size="sm"
              variant="outline"
            >
              <Plus className="size-4" aria-hidden="true" />
              Noticia
            </ButtonLink>
            <ButtonLink href="/admin/puntos" size="sm" variant="outline">
              <FileSpreadsheet className="size-4" aria-hidden="true" />
              Cargar puntos
            </ButtonLink>
          </>
        }
      />

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, highlight }) => (
          <Card
            key={label}
            className={highlight ? "border-oro-300 bg-oro-50 p-5" : "p-5"}
          >
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </dt>
            <dd className="mt-2 font-display text-4xl leading-none font-bold tabular-nums">
              {formatNumber(value)}
            </dd>
          </Card>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-2xl font-bold uppercase">
              Próximos torneos
            </h2>
            <Link
              href="/admin/torneos"
              className="text-sm font-semibold text-accent hover:text-accent-hover"
            >
              Ver todos
            </Link>
          </div>
          {upcoming.length > 0 ? (
            <ul className="divide-y divide-border">
              {upcoming.map((tournament) => {
                const status = tournamentStatus(tournament.status);
                return (
                  <li
                    key={tournament.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/torneos/${tournament.id}`}
                        className="font-semibold hover:text-accent"
                      >
                        {tournament.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {formatDateRange(
                          tournament.starts_on,
                          tournament.ends_on,
                        )}{" "}
                        · {tournament.city}
                      </p>
                    </div>
                    <Badge tone={status.tone}>{status.label}</Badge>
                    <Link
                      href={`/admin/torneos/${tournament.id}/inscripciones`}
                      className="text-sm font-semibold text-accent hover:text-accent-hover"
                    >
                      {tournament.registrations} inscriptos
                      {tournament.pending > 0 && (
                        <span className="ml-1.5 rounded-full bg-oro-100 px-2 py-0.5 text-xs text-oro-800">
                          {tournament.pending} pendientes
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-5">
              <EmptyState
                icon={Trophy}
                title="No hay torneos próximos"
                action={
                  <ButtonLink href="/admin/torneos/nuevo" size="sm">
                    Crear torneo
                  </ButtonLink>
                }
              />
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-2xl font-bold uppercase">
            Última carga de puntos
          </h2>
          {lastImport ? (
            <div className="mt-4 space-y-1 text-sm">
              <p className="font-semibold">
                {lastImport.label || lastImport.file_name || "Carga manual"}
              </p>
              <p className="text-muted-foreground">
                {formatDate(lastImport.created_at)} ·{" "}
                {lastImport.mode === "sumar"
                  ? "Sumó puntos"
                  : "Reemplazó totales"}{" "}
                · {lastImport.rows_count} jugadores
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Todavía no se cargaron puntos desde Excel.
            </p>
          )}
          <ButtonLink
            href="/admin/puntos"
            variant="outline"
            size="sm"
            className="mt-6"
          >
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            Ir a carga de puntos
          </ButtonLink>
        </Card>
      </div>
    </div>
  );
}
