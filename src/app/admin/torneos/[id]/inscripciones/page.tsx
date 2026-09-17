import {
  Check,
  ClipboardList,
  Download,
  FileSpreadsheet,
  MessageCircle,
  RotateCcw,
  X,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRegistrationStatus } from "@/app/admin/torneos/[id]/inscripciones/actions";
import { AdminPageHeader, Table, Td, Th } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/empty-state";
import { PairPlayers } from "@/components/pair-players";
import { SpotsBar } from "@/components/spots-bar";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import {
  getPlayersByProfileIds,
  getTournamentById,
  getTournamentRegistrations,
} from "@/lib/data";
import { formatDate, formatDateRange } from "@/lib/format";
import { categoryRulesLabel } from "@/lib/categories";
import { registrationStatus, spotsInfo } from "@/lib/labels";
import { siteConfig } from "@/lib/site";
import { cn, firstParam, whatsappUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Inscripciones" };

const FILTERS = [
  { value: undefined, label: "Todas" },
  { value: "invitacion", label: "Esperando pareja" },
  { value: "pendiente", label: "Pendientes" },
  { value: "confirmada", label: "Confirmadas" },
  { value: "rechazada", label: "Rechazadas" },
];

export default async function TournamentRegistrationsPage({
  params,
  searchParams,
}: PageProps<"/admin/torneos/[id]/inscripciones">) {
  const { id } = await params;
  await requireAdmin(`/admin/torneos/${id}/inscripciones`);

  const tournament = await getTournamentById(Number(id));
  if (!tournament) notFound();

  const [registrations, query] = await Promise.all([
    getTournamentRegistrations(tournament.id),
    searchParams,
  ]);

  // Para la planilla de puntos: quiénes jugaron y cuáles ya están en el ranking.
  const confirmed = registrations.filter(
    (registration) => registration.status === "confirmada",
  );
  const confirmedAccounts = confirmed.flatMap((registration) =>
    [registration.profile, registration.partnerProfile].filter(
      (profile) => profile !== null,
    ),
  );
  const rankedPlayers = await getPlayersByProfileIds(
    confirmedAccounts.map((profile) => profile.id),
  );
  const rankedIds = new Set(rankedPlayers.map((player) => player.profile_id));
  const outOfRanking = [
    ...new Map(
      confirmedAccounts
        .filter((profile) => !rankedIds.has(profile.id))
        .map((profile) => [profile.id, profile]),
    ).values(),
  ];
  const filter = firstParam(query.estado);
  const visible = filter
    ? registrations.filter((registration) => registration.status === filter)
    : registrations;
  const spots = spotsInfo(
    tournament.capacity,
    registrations.filter(
      (registration) =>
        registration.status === "pendiente" ||
        registration.status === "confirmada",
    ).length,
  );
  const countOf = (status?: string) =>
    status
      ? registrations.filter((registration) => registration.status === status)
          .length
      : registrations.length;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Inscripciones"
        description={`${tournament.name} · ${formatDateRange(tournament.starts_on, tournament.ends_on)}${categoryRulesLabel(tournament) ? ` · ${categoryRulesLabel(tournament)}` : ""}`}
        actions={
          <>
            <ButtonLink
              href={`/admin/torneos/${tournament.id}`}
              size="sm"
              variant="ghost"
            >
              Editar torneo
            </ButtonLink>
            {registrations.length > 0 && (
              <ButtonLink
                href={`/admin/torneos/${tournament.id}/inscripciones/csv`}
                size="sm"
                variant="outline"
                prefetch={false}
              >
                <Download className="size-4" aria-hidden="true" />
                Descargar CSV
              </ButtonLink>
            )}
          </>
        }
      />

      {spots && (
        <Card className="p-5 sm:p-6">
          <SpotsBar spots={spots} />
          <p className="mt-3 text-xs text-muted-foreground">
            Cuentan las pendientes y las confirmadas. Con el cupo lleno, el
            sitio no deja anotarse; si confirmás de más, el cupo se excede.
          </p>
        </Card>
      )}

      {confirmed.length > 0 && (
        <Card className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase">
                <FileSpreadsheet className="size-5" aria-hidden="true" />
                Puntos del torneo
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Cuando termine, bajá la planilla con los {rankedPlayers.length}{" "}
                {rankedPlayers.length === 1
                  ? "jugador confirmado"
                  : "jugadores confirmados"}
                , completá los puntos que ganó cada uno y subila en Carga de
                puntos: se suman a los que ya tienen.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ButtonLink
                href={`/admin/torneos/${tournament.id}/inscripciones/planilla`}
                size="sm"
                prefetch={false}
                aria-disabled={rankedPlayers.length === 0}
                className={cn(
                  rankedPlayers.length === 0 &&
                    "pointer-events-none opacity-50",
                )}
              >
                <Download className="size-4" aria-hidden="true" />
                Planilla de puntos
              </ButtonLink>
              <ButtonLink href="/admin/puntos" size="sm" variant="outline">
                Ir a carga de puntos
              </ButtonLink>
            </div>
          </div>
          {outOfRanking.length > 0 && (
            <div className="rounded-lg border border-warning-border bg-warning-soft p-4 text-sm text-warning">
              <p className="font-medium">
                {outOfRanking.length === 1
                  ? "Este jugador confirmado no está en el ranking y no va a aparecer en la planilla:"
                  : "Estos jugadores confirmados no están en el ranking y no van a aparecer en la planilla:"}
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {outOfRanking.map((profile) => (
                  <li key={profile.id}>
                    <Link
                      href={`/admin/usuarios/${profile.id}`}
                      className="inline-flex rounded-full bg-surface px-3 py-1 font-semibold text-foreground hover:text-accent"
                    >
                      {profile.full_name || `@${profile.username}`}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-2">
                Entrá a su ficha y tocá “Agregar al ranking” antes de bajar la
                planilla.
              </p>
            </div>
          )}
        </Card>
      )}

      <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
        {FILTERS.map((option) => {
          const active = option.value === filter;
          return (
            <Link
              key={option.label}
              href={
                option.value
                  ? `/admin/torneos/${tournament.id}/inscripciones?estado=${option.value}`
                  : `/admin/torneos/${tournament.id}/inscripciones`
              }
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
                active
                  ? "border-noche-950 bg-noche-950 text-white"
                  : "border-border-strong bg-surface text-foreground-soft hover:border-noche-400",
              )}
            >
              {option.label}
              <span className="tabular-nums opacity-70">
                {countOf(option.value)}
              </span>
            </Link>
          );
        })}
      </nav>

      {visible.length > 0 ? (
        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr>
                <Th>Pareja</Th>
                <Th>Contacto</Th>
                <Th>Detalle</Th>
                <Th>Estado</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((registration) => {
                const status = registrationStatus(registration.status);
                const name = registration.profile?.full_name || "Sin nombre";
                const message = `¡Hola ${name.split(" ")[0]}! Te escribimos de ${siteConfig.name} por tu inscripción al ${tournament.name}.`;
                return (
                  <tr key={registration.id} className="align-top">
                    <Td className="min-w-64">
                      <PairPlayers
                        adminLinks
                        player={registration.profile}
                        partner={registration.partnerProfile}
                        partnerName={registration.partner_name}
                        className="sm:grid-cols-1"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Se anotó el {formatDate(registration.created_at)}
                        {registration.accepted_at &&
                          ` · aceptó el ${formatDate(registration.accepted_at)}`}
                      </p>
                    </Td>
                    <Td>
                      <a
                        href={whatsappUrl(registration.contact_phone, message)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium whitespace-nowrap text-success hover:underline"
                      >
                        <MessageCircle className="size-4" aria-hidden="true" />
                        {registration.contact_phone}
                      </a>
                      {registration.profile?.email && (
                        <p className="text-xs text-muted-foreground">
                          {registration.profile.email}
                        </p>
                      )}
                      {registration.partnerProfile?.phone && (
                        <a
                          href={whatsappUrl(
                            registration.partnerProfile.phone,
                            message,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 font-medium whitespace-nowrap text-success hover:underline"
                        >
                          <MessageCircle
                            className="size-4"
                            aria-hidden="true"
                          />
                          {registration.partnerProfile.phone}
                        </a>
                      )}
                      {registration.partnerProfile?.email && (
                        <p className="text-xs text-muted-foreground">
                          {registration.partnerProfile.email}
                        </p>
                      )}
                    </Td>
                    <Td className="max-w-64 text-foreground-soft">
                      {registration.category && (
                        <p>Categoría: {registration.category}</p>
                      )}
                      {registration.notes && (
                        <p className="text-xs text-muted-foreground">
                          {registration.notes}
                        </p>
                      )}
                    </Td>
                    <Td>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </Td>
                    <Td>
                      {registration.status === "invitacion" && (
                        <p className="mb-2 max-w-48 text-right text-xs text-muted-foreground">
                          Se puede confirmar cuando{" "}
                          {registration.partnerProfile?.full_name ||
                            registration.partner_name}{" "}
                          acepte la invitación.
                        </p>
                      )}
                      <div className="flex justify-end gap-2">
                        {registration.status !== "confirmada" &&
                          registration.status !== "invitacion" && (
                            <form
                              action={setRegistrationStatus.bind(
                                null,
                                registration.id,
                                "confirmada",
                              )}
                            >
                              <SubmitButton size="sm" pendingLabel="…">
                                <Check className="size-4" aria-hidden="true" />
                                Confirmar
                              </SubmitButton>
                            </form>
                          )}
                        {registration.status !== "rechazada" && (
                          <form
                            action={setRegistrationStatus.bind(
                              null,
                              registration.id,
                              "rechazada",
                            )}
                          >
                            <SubmitButton
                              size="sm"
                              variant="outline"
                              pendingLabel="…"
                            >
                              <X className="size-4" aria-hidden="true" />
                              Rechazar
                            </SubmitButton>
                          </form>
                        )}
                        {registration.status !== "pendiente" &&
                          registration.status !== "invitacion" && (
                            <form
                              action={setRegistrationStatus.bind(
                                null,
                                registration.id,
                                "pendiente",
                              )}
                            >
                              <SubmitButton
                                size="sm"
                                variant="ghost"
                                pendingLabel="…"
                                aria-label="Volver a pendiente"
                                title="Volver a pendiente"
                              >
                                <RotateCcw
                                  className="size-4"
                                  aria-hidden="true"
                                />
                              </SubmitButton>
                            </form>
                          )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title={
            registrations.length === 0
              ? "Todavía no hay inscripciones"
              : "No hay inscripciones con este estado"
          }
          description={
            registrations.length === 0 && tournament.status !== "inscripciones"
              ? "Para que la gente se pueda anotar, poné el torneo en “Inscripciones abiertas”."
              : undefined
          }
        />
      )}

      <p className="text-sm text-muted-foreground">
        Primero la pareja acepta la invitación y después la confirmás. Al
        confirmar o rechazar, los dos jugadores reciben un aviso en su cuenta
        {process.env.RESEND_API_KEY
          ? " y un email."
          : ". El email se activa cuando configures Resend."}
      </p>
    </div>
  );
}
