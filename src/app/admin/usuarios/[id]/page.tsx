import {
  ArrowLeft,
  CalendarDays,
  Link2,
  ListOrdered,
  Mail,
  MessageCircle,
  Plus,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  linkPlayerToProfile,
  setUserAdmin,
  unlinkPlayerFromProfile,
} from "@/app/admin/usuarios/actions";
import { AddToRankingForm } from "@/components/admin/add-to-ranking-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { ProfileCategoryForm } from "@/components/admin/profile-category-form";
import { EmptyState } from "@/components/empty-state";
import { SubmitButton } from "@/components/submit-button";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
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
import { firstParam, slugify, whatsappUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Perfil de usuario" };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ficha de una cuenta: quién es, cómo contactarla y en qué torneos se anotó. */
export default async function AdminUserPage({
  params,
  searchParams,
}: PageProps<"/admin/usuarios/[id]">) {
  const { id } = await params;
  const me = await requireAdmin(`/admin/usuarios/${id}`);
  if (!UUID_PATTERN.test(id)) notFound();

  const [profile, registrations, players, query] = await Promise.all([
    getProfileById(id),
    getUserRegistrations(id),
    getRanking({ includeInactive: true }),
    searchParams,
  ]);
  if (!profile) notFound();

  const name = profile.full_name || `@${profile.username}`;
  const isMe = profile.id === me.id;
  const linked = players.find((player) => player.profile_id === profile.id);
  // Jugadores sin cuenta con el mismo nombre: probablemente sea la misma persona.
  const suggestions =
    linked || !profile.full_name
      ? []
      : players.filter(
          (player) =>
            !player.profile_id &&
            slugify(playerName(player)) === slugify(profile.full_name!),
        );
  const error = firstParam(query.error);
  const notice = query.vinculado
    ? "Vinculamos la cuenta con su jugador del ranking."
    : query.desvinculado
      ? "Desvinculamos la cuenta. El jugador sigue en el ranking con sus puntos."
      : query.admin === "si"
        ? "Ahora es administrador. Le avisamos en su cuenta."
        : query.admin === "no"
          ? "Ya no es administrador."
          : null;
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
      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}

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

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase">
              <ListOrdered className="size-5" aria-hidden="true" />
              Ranking y puntos
            </h2>
            <p className="text-sm text-muted-foreground">
              {linked
                ? "Esta cuenta está vinculada a su jugador del ranking."
                : "Todavía no está en el ranking: sin esto no tiene puntos."}
            </p>
          </div>
          {linked && <Badge tone="success">Vinculado</Badge>}
        </div>

        {linked ? (
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <Avatar
                name={playerName(linked)}
                src={linked.photo_url}
                size="md"
              />
              <div className="min-w-0">
                <p className="font-semibold">{playerName(linked)}</p>
                <p className="text-sm text-muted-foreground">
                  {branchLabel(linked.gender)} · {linked.category}
                  {!linked.active && " · ya no compite"}
                </p>
              </div>
              <p className="ml-auto text-right">
                <span className="block font-display text-4xl leading-none font-bold tabular-nums">
                  {formatNumber(linked.ranking_points)}
                </span>
                <span className="text-xs text-muted-foreground">puntos</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
              <ButtonLink
                href={`/admin/jugadores/${linked.id}#puntos`}
                size="sm"
              >
                <Plus className="size-4" aria-hidden="true" />
                Sumar o restar puntos
              </ButtonLink>
              <ButtonLink
                href={`/admin/jugadores/${linked.id}`}
                size="sm"
                variant="outline"
              >
                Editar jugador
              </ButtonLink>
              <form
                action={unlinkPlayerFromProfile.bind(
                  null,
                  profile.id,
                  linked.id,
                )}
              >
                <ConfirmSubmitButton
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  pendingLabel="Desvinculando…"
                  confirmMessage={`¿Desvincular a ${playerName(linked)} de esta cuenta? El jugador sigue en el ranking con sus puntos.`}
                >
                  Desvincular
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-6 p-5 sm:p-6">
            {suggestions.length > 0 && (
              <div className="space-y-3 rounded-lg border border-pista-200 bg-pista-50 p-4">
                <p className="text-sm font-medium text-pista-800">
                  Ya hay {suggestions.length === 1 ? "un jugador" : "jugadores"}{" "}
                  en el ranking con este nombre. Si es la misma persona,
                  vinculalo y conserva sus puntos:
                </p>
                <ul className="space-y-2">
                  {suggestions.map((player) => (
                    <li
                      key={player.id}
                      className="flex flex-wrap items-center gap-3 rounded-lg bg-surface p-3"
                    >
                      <Avatar
                        name={playerName(player)}
                        src={player.photo_url}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <Link
                          href={`/admin/jugadores/${player.id}`}
                          className="block font-semibold hover:text-accent"
                        >
                          {playerName(player)}
                        </Link>
                        <span className="block text-xs text-muted-foreground">
                          {branchLabel(player.gender)} · {player.category} ·{" "}
                          {formatNumber(player.ranking_points)} pts
                          {!player.active && " · ya no compite"}
                        </span>
                      </span>
                      <form
                        action={linkPlayerToProfile.bind(
                          null,
                          profile.id,
                          player.id,
                        )}
                      >
                        <SubmitButton size="sm" pendingLabel="Vinculando…">
                          <Link2 className="size-4" aria-hidden="true" />
                          Vincular
                        </SubmitButton>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h3 className="font-semibold">
                {suggestions.length > 0
                  ? "O agregalo como jugador nuevo"
                  : "Agregar al ranking"}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Se crea su jugador con el nombre y la foto de la cuenta.
              </p>
              <AddToRankingForm
                userId={profile.id}
                defaultCategory={
                  profile.category ? categoryName(profile.category) : null
                }
              />
            </div>
          </div>
        )}
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
              <ShieldCheck className="size-5" aria-hidden="true" />
              Administrador
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile.is_admin
                ? "Puede entrar al panel y cambiar torneos, jugadores, puntos y usuarios."
                : "No tiene acceso al panel."}
            </p>
            {isMe ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Es tu cuenta: tu permiso lo cambia otro admin.
              </p>
            ) : (
              <form
                action={setUserAdmin.bind(null, profile.id, !profile.is_admin)}
                className="mt-4"
              >
                <ConfirmSubmitButton
                  size="sm"
                  variant={profile.is_admin ? "outline" : "secondary"}
                  pendingLabel="Guardando…"
                  confirmMessage={
                    profile.is_admin
                      ? `¿Quitarle el permiso de administrador a ${name}?`
                      : `¿Hacer administrador a ${name}? Va a poder ver y cambiar todo el panel. Hacelo solo si confirmaste que la cuenta es de esa persona.`
                  }
                >
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  {profile.is_admin ? "Quitar admin" : "Hacer admin"}
                </ConfirmSubmitButton>
              </form>
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
