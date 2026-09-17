import {
  Check,
  CircleCheckBig,
  MessageCircle,
  TriangleAlert,
  X,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { setRegistrationStatus } from "@/app/admin/torneos/[id]/inscripciones/actions";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/empty-state";
import { PairPlayers } from "@/components/pair-players";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { categoryName, categoryRulesLabel } from "@/lib/categories";
import { getPendingRegistrations, getTournamentSpots } from "@/lib/data";
import { formatDate, formatDateRange } from "@/lib/format";
import { spotsInfo } from "@/lib/labels";
import { siteConfig } from "@/lib/site";
import { whatsappUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Inscripciones para confirmar" };

/** Todas las inscripciones pendientes, agrupadas por torneo, para confirmarlas de una. */
export default async function PendingRegistrationsPage() {
  await requireAdmin("/admin/inscripciones");
  const [pending, spots] = await Promise.all([
    getPendingRegistrations(),
    getTournamentSpots(),
  ]);

  const groups = new Map<number, typeof pending>();
  for (const registration of pending) {
    const id = registration.tournament.id;
    groups.set(id, [...(groups.get(id) ?? []), registration]);
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Para confirmar"
        description={
          pending.length > 0
            ? `${pending.length} ${pending.length === 1 ? "pareja aceptó la invitación y espera" : "parejas aceptaron la invitación y esperan"} tu confirmación. Al confirmar o rechazar, a los dos jugadores les llega un aviso.`
            : "Acá aparecen las parejas que ya aceptaron la invitación y esperan tu confirmación."
        }
      />

      {pending.length === 0 ? (
        <EmptyState
          icon={CircleCheckBig}
          title="No hay inscripciones para confirmar"
          description="Estás al día. Cuando una pareja se anote y acepte la invitación, aparece acá."
          action={
            <ButtonLink href="/admin/torneos" variant="outline" size="sm">
              Ver torneos
            </ButtonLink>
          }
        />
      ) : (
        [...groups.values()].map((registrations) => {
          const { tournament } = registrations[0];
          const cupo = spotsInfo(tournament.capacity, spots.get(tournament.id));
          const rules = categoryRulesLabel(tournament);

          return (
            <Card key={tournament.id} className="overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/50 px-4 py-4 sm:px-6">
                <div className="min-w-0">
                  <Link
                    href={`/admin/torneos/${tournament.id}/inscripciones`}
                    className="font-display text-2xl leading-tight font-bold uppercase hover:text-accent"
                  >
                    {tournament.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {formatDateRange(tournament.starts_on, tournament.ends_on)}
                    {rules && ` · ${rules}`}
                    {cupo && ` · ${cupo.taken}/${cupo.capacity} parejas`}
                  </p>
                </div>
                <Badge tone="primary">
                  {registrations.length}{" "}
                  {registrations.length === 1 ? "pendiente" : "pendientes"}
                </Badge>
                {cupo?.full && (
                  <p className="flex w-full items-center gap-2 text-sm font-medium text-warning">
                    <TriangleAlert
                      className="size-4 shrink-0"
                      aria-hidden="true"
                    />
                    El cupo está completo contando las pendientes: si confirmás
                    todas, no queda lugar para nadie más.
                  </p>
                )}
              </div>

              <ul className="divide-y divide-border">
                {registrations.map((registration) => {
                  const name =
                    registration.profile?.full_name || "Jugador sin nombre";
                  const message = `¡Hola ${name.split(" ")[0]}! Te escribimos de ${siteConfig.name} por tu inscripción al ${tournament.name}.`;
                  const categories = [
                    registration.player_category,
                    registration.partner_category,
                  ]
                    .filter((value): value is number => value !== null)
                    .map(categoryName);

                  return (
                    <li
                      key={registration.id}
                      className="grid gap-4 px-4 py-5 sm:px-6 md:grid-cols-[1fr_auto] md:items-center"
                    >
                      <div className="min-w-0 space-y-3">
                        <PairPlayers
                          adminLinks
                          player={registration.profile}
                          partner={registration.partnerProfile}
                          partnerName={registration.partner_name}
                        />
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span>
                            Se anotaron el {formatDate(registration.created_at)}
                            {registration.accepted_at &&
                              ` · aceptó el ${formatDate(registration.accepted_at)}`}
                          </span>
                          {categories.length > 0 && (
                            <span>Categorías: {categories.join(" y ")}</span>
                          )}
                          <a
                            href={whatsappUrl(
                              registration.contact_phone,
                              message,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-medium text-success hover:underline"
                          >
                            <MessageCircle
                              className="size-4"
                              aria-hidden="true"
                            />
                            {registration.contact_phone}
                          </a>
                        </div>
                        {registration.notes && (
                          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground-soft">
                            {registration.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 md:flex-col md:items-stretch">
                        <form
                          action={setRegistrationStatus.bind(
                            null,
                            registration.id,
                            "confirmada",
                          )}
                          className="flex-1"
                        >
                          <SubmitButton
                            size="sm"
                            pendingLabel="Confirmando…"
                            className="w-full"
                          >
                            <Check className="size-4" aria-hidden="true" />
                            Confirmar
                          </SubmitButton>
                        </form>
                        <form
                          action={setRegistrationStatus.bind(
                            null,
                            registration.id,
                            "rechazada",
                          )}
                          className="flex-1"
                        >
                          <SubmitButton
                            size="sm"
                            variant="outline"
                            pendingLabel="Rechazando…"
                            className="w-full"
                          >
                            <X className="size-4" aria-hidden="true" />
                            Rechazar
                          </SubmitButton>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })
      )}
    </div>
  );
}
