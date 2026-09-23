import {
  Check,
  ClipboardList,
  MessageCircle,
  RotateCcw,
  X,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setClubRegistrationStatus } from "@/app/mi-club/actions";
import { AdminPageHeader, Table, Td, Th } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/empty-state";
import { PairPlayers } from "@/components/pair-players";
import { SpotsBar } from "@/components/spots-bar";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireClubOwner } from "@/lib/auth";
import { categoryRulesLabel } from "@/lib/categories";
import {
  getClubRegistrations,
  getTournamentById,
  getWaitlistCount,
} from "@/lib/data";
import { formatDate, formatDateRange } from "@/lib/format";
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

/**
 * Las inscripciones de un torneo del club. El dueño ve nombre, usuario, foto,
 * categoría y rama de cada jugador, y el teléfono de contacto de la pareja.
 * Nunca emails ni notas.
 */
export default async function ClubRegistrationsPage({
  params,
  searchParams,
}: PageProps<"/mi-club/torneos/[id]/inscripciones">) {
  const { id } = await params;
  const tournament = await getTournamentById(Number(id));
  await requireClubOwner(
    `/mi-club/torneos/${id}/inscripciones`,
    tournament?.club_id ?? null,
  );
  if (!tournament) notFound();

  const [registrations, waiting, query] = await Promise.all([
    getClubRegistrations(tournament.id),
    getWaitlistCount(tournament.id),
    searchParams,
  ]);
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
  const base = `/mi-club/torneos/${tournament.id}/inscripciones`;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Inscripciones"
        description={`${tournament.name} · ${formatDateRange(tournament.starts_on, tournament.ends_on)}${categoryRulesLabel(tournament) ? ` · ${categoryRulesLabel(tournament)}` : ""}`}
        actions={
          <ButtonLink
            href={`/mi-club/torneos/${tournament.id}`}
            size="sm"
            variant="ghost"
          >
            Editar torneo
          </ButtonLink>
        }
      />

      {spots && (
        <Card className="p-5 sm:p-6">
          <SpotsBar spots={spots} />
          {waiting > 0 && (
            <p className="mt-3 text-sm font-semibold text-oro-800">
              {waiting === 1
                ? "1 persona en lista de espera"
                : `${waiting} personas en lista de espera`}
              . Si se libera un lugar, le avisamos al primero.
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Cuentan las pendientes y las confirmadas. Con el cupo lleno, el
            sitio no deja anotarse.
          </p>
        </Card>
      )}

      <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
        {FILTERS.map((option) => {
          const active = option.value === filter;
          return (
            <Link
              key={option.label}
              href={option.value ? `${base}?estado=${option.value}` : base}
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
                <Th>Estado</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((registration) => {
                const status = registrationStatus(registration.status);
                const act = (next: "pendiente" | "confirmada" | "rechazada") =>
                  setClubRegistrationStatus.bind(
                    null,
                    tournament.id,
                    registration.id,
                    next,
                  );
                return (
                  <tr key={registration.id} className="align-top">
                    <Td className="min-w-64">
                      <PairPlayers
                        player={registration.player}
                        partner={registration.partner}
                        partnerName={registration.partner_name}
                        showGender
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
                        href={whatsappUrl(
                          registration.contact_phone,
                          `¡Hola ${(registration.player?.full_name || "").split(" ")[0]}! Te escribimos de ${tournament.venue || siteConfig.name} por tu inscripción al ${tournament.name}.`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium whitespace-nowrap text-success hover:underline"
                      >
                        <MessageCircle className="size-4" aria-hidden="true" />
                        {registration.contact_phone}
                      </a>
                    </Td>
                    <Td>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </Td>
                    <Td>
                      {registration.status === "invitacion" && (
                        <p className="mb-2 max-w-48 text-right text-xs text-muted-foreground">
                          Se puede confirmar cuando{" "}
                          {registration.partner?.full_name ||
                            registration.partner_name}{" "}
                          acepte la invitación.
                        </p>
                      )}
                      {registration.status === "cancelada" ? (
                        <p className="text-right text-xs text-muted-foreground">
                          La cancelaron los jugadores.
                        </p>
                      ) : (
                        <div className="flex justify-end gap-2">
                          {registration.status !== "confirmada" &&
                            registration.status !== "invitacion" && (
                              <form action={act("confirmada")}>
                                <SubmitButton size="sm" pendingLabel="…">
                                  <Check
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                  Confirmar
                                </SubmitButton>
                              </form>
                            )}
                          {registration.status !== "rechazada" && (
                            <form action={act("rechazada")}>
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
                              <form action={act("pendiente")}>
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
        confirmar o rechazar, los dos jugadores reciben un aviso en su cuenta.
      </p>
    </div>
  );
}
