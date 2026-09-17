import {
  ArrowLeft,
  CalendarDays,
  ListOrdered,
  Mail,
  MessageCircle,
  Trophy,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfileCategoryForm } from "@/components/admin/profile-category-form";
import { EmptyState } from "@/components/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { categoryName } from "@/lib/categories";
import { getProfileById, getRanking, getUserRegistrations } from "@/lib/data";
import { formatDate, formatDateRange, formatNumber } from "@/lib/format";
import {
  branchLabel,
  playerName,
  registrationStatus,
  tournamentStatus,
} from "@/lib/labels";
import { slugify, whatsappUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Perfil de usuario" };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ficha de una cuenta: quién es, cómo contactarla y en qué torneos se anotó. */
export default async function AdminUserPage({
  params,
}: PageProps<"/admin/usuarios/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/usuarios/${id}`);
  if (!UUID_PATTERN.test(id)) notFound();

  const [profile, registrations, players] = await Promise.all([
    getProfileById(id),
    getUserRegistrations(id),
    getRanking({ includeInactive: true }),
  ]);
  if (!profile) notFound();

  const name = profile.full_name || `@${profile.username}`;
  // Las cuentas y el ranking no están vinculados: sugerimos por nombre.
  const rankingMatches = profile.full_name
    ? players.filter(
        (player) => slugify(playerName(player)) === slugify(profile.full_name!),
      )
    : [];
  const confirmed = registrations.filter(
    (registration) => registration.status === "confirmada",
  );
  const played = confirmed.filter(
    (registration) => registration.tournament.status === "finalizado",
  );

  return (
    <div className="space-y-6">
      <Link
        href="/admin/usuarios"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Usuarios
      </Link>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <Avatar
            name={name}
            src={profile.avatar_url}
            size="xl"
            className="size-24 text-3xl sm:size-28"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-4xl leading-none font-bold uppercase">
                {name}
              </h1>
              {profile.is_admin && <Badge tone="dark">Admin</Badge>}
            </div>
            <p className="mt-1 text-muted-foreground">
              @{profile.username} · Cuenta creada el{" "}
              {formatDate(profile.created_at)}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
                >
                  <Mail className="size-4" aria-hidden="true" />
                  {profile.email}
                </a>
              )}
              {profile.phone ? (
                <a
                  href={whatsappUrl(profile.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-success hover:underline"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  {profile.phone}
                </a>
              ) : (
                <span className="text-muted-foreground">
                  Sin teléfono cargado
                </span>
              )}
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-3 divide-x divide-border border-t border-border">
          {[
            { label: "Inscripciones", value: registrations.length },
            { label: "Confirmadas", value: confirmed.length },
            { label: "Torneos jugados", value: played.length },
          ].map((stat) => (
            <div key={stat.label} className="px-4 py-4 sm:px-6">
              <dt className="text-xs text-muted-foreground sm:text-sm">
                {stat.label}
              </dt>
              <dd className="font-display text-3xl leading-none font-bold tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-2xl font-bold uppercase">
              Categoría
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile.category
                ? `Hoy es ${categoryName(profile.category)}. Si la cambiás, le llega un aviso.`
                : "No tiene categoría: no se puede anotar en torneos con categoría."}
            </p>
            <div className="mt-4">
              <ProfileCategoryForm
                userId={profile.id}
                name={name}
                category={profile.category}
              />
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase">
              <ListOrdered className="size-5" aria-hidden="true" />
              En el ranking
            </h2>
            {rankingMatches.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {rankingMatches.map((player) => (
                  <li key={player.id}>
                    <Link
                      href={`/admin/jugadores/${player.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                    >
                      <Avatar
                        name={playerName(player)}
                        src={player.photo_url}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">
                          {playerName(player)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {branchLabel(player.gender)} · {player.category} ·{" "}
                          {formatNumber(player.ranking_points)} pts
                          {!player.active && " · ya no compite"}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
                <li className="text-xs text-muted-foreground">
                  Coincide por nombre: fijate que sea la misma persona.
                </li>
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No hay ningún jugador del ranking con este nombre.
              </p>
            )}
          </Card>
        </div>

        <Card className="overflow-hidden lg:col-span-2">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase">
              <Trophy className="size-5" aria-hidden="true" />
              Torneos
            </h2>
            <p className="text-sm text-muted-foreground">
              Todas sus inscripciones, como quien se anotó o como pareja.
            </p>
          </div>
          {registrations.length > 0 ? (
            <ul className="divide-y divide-border">
              {registrations.map((registration) => {
                const status = registrationStatus(registration.status);
                const partner =
                  registration.user_id === profile.id
                    ? registration.partnerProfile
                    : registration.profile;
                const partnerName =
                  partner?.full_name ||
                  (registration.user_id === profile.id
                    ? registration.partner_name
                    : "Jugador");

                return (
                  <li
                    key={registration.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 sm:px-6"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/torneos/${registration.tournament.id}/inscripciones`}
                        className="font-semibold hover:text-accent"
                      >
                        {registration.tournament.name}
                      </Link>
                      <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          {formatDateRange(
                            registration.tournament.starts_on,
                            registration.tournament.ends_on,
                          )}
                        </span>
                        <span>
                          {
                            tournamentStatus(registration.tournament.status)
                              .label
                          }
                        </span>
                      </p>
                      <p className="mt-1 text-sm">
                        Con{" "}
                        {partner ? (
                          <Link
                            href={`/admin/usuarios/${partner.id}`}
                            className="font-medium text-accent hover:underline"
                          >
                            {partnerName}
                          </Link>
                        ) : (
                          <span className="font-medium">{partnerName}</span>
                        )}
                      </p>
                    </div>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-5 sm:p-6">
              <EmptyState
                icon={Trophy}
                title="Todavía no se anotó en ningún torneo"
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
