import {
  ArrowLeft,
  CalendarDays,
  ListOrdered,
  Mail,
  MessageCircle,
  ShieldCheck,
  ShieldOff,
  Trophy,
  Unlink,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  linkProfilePlayer,
  setProfileAdmin,
} from "@/app/admin/usuarios/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { ProfileBirthdateForm } from "@/components/admin/profile-birthdate-form";
import { ProfileCategoryForm } from "@/components/admin/profile-category-form";
import { ProfileGenderForm } from "@/components/admin/profile-gender-form";
import {
  type LinkablePlayer,
  PlayerLinkPicker,
  PlayerLinkRow,
} from "@/components/admin/player-link-picker";
import { EmptyState } from "@/components/empty-state";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { ZoomableAvatar } from "@/components/zoomable-avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { categoryName } from "@/lib/categories";
import {
  getLinkedAccounts,
  getProfileById,
  getRanking,
  getUserRegistrations,
} from "@/lib/data";
import { formatDate, formatDateRange, formatNumber } from "@/lib/format";
import {
  branchLabel,
  genderLabel,
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

  const [profile, registrations, players, linkedAccounts, query] =
    await Promise.all([
      getProfileById(id),
      getUserRegistrations(id),
      getRanking({ includeInactive: true }),
      getLinkedAccounts(),
      searchParams,
    ]);
  const error = firstParam(query.error);
  const adminChange = firstParam(query.admin);
  const linkChange = firstParam(query.vinculo);
  if (!profile) notFound();

  const name = profile.full_name || `@${profile.username}`;
  const linkedPlayer = profile.player_id
    ? (players.find((player) => player.id === profile.player_id) ?? null)
    : null;
  const account = {
    userId: profile.id,
    name,
    category: profile.category,
    gender: profile.gender,
  };
  const linkablePlayers: LinkablePlayer[] = players.map((player) => ({
    id: player.id,
    name: playerName(player),
    gender: player.gender,
    category: player.category,
    points: player.ranking_points,
    active: player.active,
    linkedTo: linkedAccounts.get(player.id)?.username ?? null,
  }));
  // Sugerencia: jugadores del ranking con el mismo nombre que la cuenta.
  const rankingMatches = profile.full_name
    ? linkablePlayers.filter(
        (player) => slugify(player.name) === slugify(profile.full_name!),
      )
    : [];
  const confirmed = registrations.filter(
    (registration) => registration.status === "confirmada",
  );
  const played = confirmed.filter(
    (registration) => registration.tournament.status === "finalizado",
  );

  const isMe = profile.id === me.id;

  return (
    <div className="space-y-6">
      {error && <Alert tone="danger">{error}</Alert>}
      {linkChange && (
        <Alert tone="success">
          {linkChange === "1"
            ? `Vinculamos la cuenta de ${name} con su jugador del ranking.`
            : `Desvinculamos la cuenta de ${name} del ranking.`}
        </Alert>
      )}
      {adminChange && (
        <Alert tone="success">
          {adminChange === "1"
            ? `${name} ahora es admin: ya puede entrar al panel.`
            : `${name} ya no es admin.`}
        </Alert>
      )}
      <Link
        href="/admin/usuarios"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Usuarios
      </Link>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <ZoomableAvatar
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
              {isMe ? (
                <Badge>Sos vos</Badge>
              ) : (
                <form
                  action={setProfileAdmin.bind(
                    null,
                    profile.id,
                    !profile.is_admin,
                  )}
                >
                  <ConfirmSubmitButton
                    size="sm"
                    variant={profile.is_admin ? "ghost" : "outline"}
                    className={
                      profile.is_admin
                        ? "text-danger hover:bg-danger-soft hover:text-danger"
                        : undefined
                    }
                    pendingLabel="Guardando…"
                    confirmMessage={
                      profile.is_admin
                        ? `¿Quitarle el admin a ${name}? Deja de ver el panel.`
                        : `¿Hacer admin a ${name}? Va a poder editar torneos, jugadores, usuarios y puntos.`
                    }
                  >
                    {profile.is_admin ? (
                      <ShieldOff className="size-4" aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="size-4" aria-hidden="true" />
                    )}
                    {profile.is_admin ? "Quitar admin" : "Hacer admin"}
                  </ConfirmSubmitButton>
                </form>
              )}
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
              Categoría y rama
            </h2>
            {linkedPlayer ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {profile.category
                  ? categoryName(profile.category)
                  : "Sin categoría"}{" "}
                · {profile.gender ? genderLabel(profile.gender) : "Sin rama"}.
                Salen de su ficha en el ranking:{" "}
                <Link
                  href={`/admin/jugadores/${linkedPlayer.id}`}
                  className="font-medium text-accent hover:underline"
                >
                  cambialas ahí
                </Link>
                .
              </p>
            ) : (
              <>
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
                <p className="mt-5 text-sm text-muted-foreground">
                  {profile.gender
                    ? `Rama: ${genderLabel(profile.gender).toLowerCase()}. Si la cambiás, le llega un aviso.`
                    : "Todavía no eligió su rama: no se puede anotar hasta que la elija (o se la asignes vos)."}
                </p>
                <div className="mt-3">
                  <ProfileGenderForm
                    userId={profile.id}
                    name={name}
                    gender={profile.gender}
                  />
                </div>
                <p className="mt-5 text-sm text-muted-foreground">
                  {profile.birthdate
                    ? "Fecha de nacimiento: la usa solo para los torneos con límite de edad. No se muestra en el sitio."
                    : "Todavía no cargó su fecha de nacimiento: no se puede anotar en torneos con límite de edad (+30, -20)."}
                </p>
                <div className="mt-3">
                  <ProfileBirthdateForm
                    userId={profile.id}
                    name={name}
                    birthdate={profile.birthdate}
                  />
                </div>
              </>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase">
              <ListOrdered className="size-5" aria-hidden="true" />
              En el ranking
            </h2>
            {linkedPlayer ? (
              <div className="mt-4 space-y-3">
                <Link
                  href={`/admin/jugadores/${linkedPlayer.id}`}
                  className="flex items-center gap-3 rounded-lg border border-success/40 bg-success-soft p-3 transition-colors hover:bg-muted"
                >
                  <Avatar
                    name={playerName(linkedPlayer)}
                    src={linkedPlayer.photo_url}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">
                      {playerName(linkedPlayer)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {branchLabel(linkedPlayer.gender)} ·{" "}
                      {linkedPlayer.category} ·{" "}
                      {formatNumber(linkedPlayer.ranking_points)} pts
                      {!linkedPlayer.active && " · ya no compite"}
                    </span>
                  </span>
                </Link>
                <p className="text-sm text-muted-foreground">
                  La categoría y la rama de la cuenta salen de este jugador: si
                  las cambiás en su ficha, cambian acá también.
                </p>
                <form action={linkProfilePlayer.bind(null, profile.id, null)}>
                  <ConfirmSubmitButton
                    size="sm"
                    variant="ghost"
                    pendingLabel="Desvinculando…"
                    confirmMessage={`¿Desvincular la cuenta de ${name} del ranking? La cuenta conserva la categoría y la rama que tiene ahora.`}
                  >
                    <Unlink className="size-4" aria-hidden="true" />
                    Desvincular
                  </ConfirmSubmitButton>
                </form>
              </div>
            ) : (
              <div className="mt-2 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Vinculala con su jugador del ranking: la categoría y la rama
                  van a salir de ahí y en Mi cuenta va a ver su puesto.
                </p>
                {rankingMatches.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground-soft">
                      Coincide por nombre
                    </p>
                    <ul className="mt-1.5 space-y-2">
                      {rankingMatches.map((player) => (
                        <PlayerLinkRow
                          key={player.id}
                          player={player}
                          account={account}
                        />
                      ))}
                    </ul>
                  </div>
                )}
                <PlayerLinkPicker account={account} players={linkablePlayers} />
              </div>
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
