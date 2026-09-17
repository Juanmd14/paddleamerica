import {
  Bell,
  CalendarDays,
  ChevronRight,
  History,
  KeyRound,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  MailOpen,
  MapPin,
  Trophy,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/auth/actions";
import { cancelRegistration } from "@/app/torneos/[slug]/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { AvatarUpload } from "@/components/avatar-upload";
import { EmptyState } from "@/components/empty-state";
import { InvitationResponse } from "@/components/invitation-response";
import { MarkNotificationsRead } from "@/components/mark-notifications-read";
import { PairPlayers } from "@/components/pair-players";
import { ProfileForm } from "@/components/profile-form";
import { SubmitButton } from "@/components/submit-button";
import { SupabaseNotice } from "@/components/supabase-notice";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getCurrentUser } from "@/lib/auth";
import { categoryName } from "@/lib/categories";
import {
  getMyNotifications,
  getMyProfile,
  getMyRegistrations,
  getPlayerByProfileId,
  getRankingPosition,
} from "@/lib/data";
import { formatDate, formatDateRange, formatNumber } from "@/lib/format";
import { registrationStatus, tournamentStatus } from "@/lib/labels";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn, firstParam } from "@/lib/utils";
import type { Notification, RegistrationWithTournament } from "@/types/models";

export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: { index: false },
};

const SECTIONS = [
  {
    key: "torneos",
    label: "Mis torneos",
    icon: Trophy,
    description: "Tus inscripciones, invitaciones y torneos jugados.",
  },
  {
    key: "avisos",
    label: "Avisos",
    icon: Bell,
    description: "Novedades de tus inscripciones e invitaciones.",
  },
  {
    key: "datos",
    label: "Mis datos",
    icon: UserRound,
    description: "Tu foto, nombre, usuario, categoría y contraseña.",
  },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

/** Estados de una inscripción que siguen en pie. */
const ACTIVE_STATUSES = ["invitacion", "pendiente", "confirmada"];

function sectionHref(key: SectionKey) {
  return key === "torneos" ? "/mi-cuenta" : `/mi-cuenta?seccion=${key}`;
}

export default async function AccountPage({
  searchParams,
}: PageProps<"/mi-cuenta">) {
  if (!isSupabaseConfigured) {
    return (
      <Container className="max-w-3xl py-12 sm:py-16">
        <SupabaseNotice />
      </Container>
    );
  }

  // El proxy ya protege esta ruta, pero siempre verificá en el servidor también.
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/mi-cuenta");

  const [profile, registrations, notifications, player, params] =
    await Promise.all([
      getMyProfile(),
      getMyRegistrations(),
      getMyNotifications(),
      getPlayerByProfileId(user.id),
      searchParams,
    ]);
  const position = player ? await getRankingPosition(player) : null;
  const message = firstParam(params.message);
  const section: SectionKey =
    SECTIONS.find((item) => item.key === firstParam(params.seccion))?.key ??
    "torneos";

  const invitations = registrations.filter(
    (registration) =>
      registration.partner_id === user.id &&
      registration.status === "invitacion",
  );
  const mine = registrations.filter(
    (registration) => !invitations.includes(registration),
  );
  const upcoming = mine.filter(
    (registration) => registration.tournament.status !== "finalizado",
  );
  const played = mine.filter(
    (registration) => registration.tournament.status === "finalizado",
  );
  const activeUpcoming = upcoming.filter((registration) =>
    ACTIVE_STATUSES.includes(registration.status),
  ).length;
  const unread = notifications.filter(
    (notification) => !notification.read_at,
  ).length;
  const name = profile?.full_name || user.name;

  const counts: Record<SectionKey, number> = {
    torneos: invitations.length,
    avisos: unread,
    datos: profile?.category ? 0 : 1,
  };
  const current = SECTIONS.find((item) => item.key === section)!;

  return (
    <>
      <section className="bg-noche-950 text-white">
        <Container className="py-8 sm:py-12">
          <div className="flex items-center gap-4 sm:gap-6">
            <Avatar
              name={name}
              src={user.avatarUrl}
              size="lg"
              className="size-16 shrink-0 bg-noche-800 text-xl ring-2 ring-oro-400 sm:size-20 sm:text-2xl"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold tracking-[0.25em] text-oro-400 uppercase">
                Mi cuenta
              </p>
              <h1 className="mt-1 truncate font-display text-3xl leading-none font-bold uppercase sm:text-5xl">
                {name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-noche-300">
                {user.username && (
                  <span className="font-semibold text-white">
                    @{user.username}
                  </span>
                )}
                {profile?.category ? (
                  <Badge tone="primary">
                    Categoría {categoryName(profile.category)}
                  </Badge>
                ) : (
                  <Badge tone="inverse">Sin categoría</Badge>
                )}
              </div>
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              {user.isAdmin && (
                <ButtonLink href="/admin" size="sm">
                  <LayoutDashboard className="size-4" aria-hidden="true" />
                  Panel
                </ButtonLink>
              )}
              <form action={signOut}>
                <SubmitButton
                  variant="inverse"
                  size="sm"
                  pendingLabel="Saliendo…"
                >
                  Cerrar sesión
                </SubmitButton>
              </form>
            </div>
          </div>

          {/* Resumen: cada número lleva a la sección donde se resuelve. */}
          <ul
            className={cn(
              "mt-6 grid gap-2 sm:mt-8 sm:gap-4",
              player ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3",
            )}
          >
            {player && (
              <SummaryTile
                href={`/jugadores/${player.slug}`}
                value={formatNumber(player.ranking_points)}
                label={
                  position
                    ? `Puntos · #${position} en el ranking`
                    : "Puntos en el ranking"
                }
              />
            )}
            <SummaryTile
              href={sectionHref("torneos")}
              value={activeUpcoming}
              label="Próximos torneos"
            />
            <SummaryTile
              href={sectionHref("torneos")}
              value={invitations.length}
              label="Invitaciones"
              highlight={invitations.length > 0}
            />
            <SummaryTile
              href={sectionHref("avisos")}
              value={unread}
              label="Avisos nuevos"
              highlight={unread > 0}
            />
          </ul>
        </Container>
      </section>

      {/* En celulares, las secciones son pestañas fijas debajo del header. */}
      <nav
        aria-label="Secciones de mi cuenta"
        className="sticky top-16 z-30 border-b border-border bg-surface/95 backdrop-blur lg:hidden"
      >
        <Container>
          <ul className="grid grid-cols-3">
            {SECTIONS.map((item) => {
              const active = item.key === section;
              const Icon = item.icon;
              return (
                <li key={item.key}>
                  <Link
                    href={sectionHref(item.key)}
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex h-14 items-center justify-center gap-1.5 text-sm font-semibold transition-colors",
                      active
                        ? "text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon
                      className="size-4 shrink-0 max-[380px]:hidden"
                      aria-hidden="true"
                    />
                    {item.label}
                    {counts[item.key] > 0 && (
                      <span
                        className="size-2 shrink-0 rounded-full bg-primary"
                        aria-label="con novedades"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </nav>

      <Container className="grid gap-6 py-6 sm:py-10 lg:grid-cols-[17rem_1fr] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <Card className="p-2">
              <nav aria-label="Secciones de mi cuenta">
                <ul className="space-y-1">
                  {SECTIONS.map((item) => {
                    const active = item.key === section;
                    const Icon = item.icon;
                    return (
                      <li key={item.key}>
                        <Link
                          href={sectionHref(item.key)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                            active
                              ? "bg-noche-950 text-white"
                              : "text-foreground-soft hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <Icon
                            className="size-5 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="flex-1 font-semibold">
                            {item.label}
                          </span>
                          {item.key !== "datos" && counts[item.key] > 0 && (
                            <span className="flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs leading-5 font-bold text-primary-foreground tabular-nums">
                              {counts[item.key]}
                            </span>
                          )}
                          {item.key === "datos" && counts.datos > 0 && (
                            <span
                              className="size-2 rounded-full bg-primary"
                              aria-label="falta la categoría"
                            />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </Card>
            {user.isAdmin && (
              <Card className="border-oro-300 bg-oro-50 p-4">
                <p className="font-semibold">Panel de administración</p>
                <p className="text-sm text-muted-foreground">
                  Torneos, jugadores, usuarios y puntos.
                </p>
                <ButtonLink href="/admin" size="sm" className="mt-3">
                  <LayoutDashboard className="size-4" aria-hidden="true" />
                  Abrir panel
                </ButtonLink>
              </Card>
            )}
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          {message && <Alert tone="success">{message}</Alert>}

          <SectionPanel
            icon={current.icon}
            title={current.label}
            description={current.description}
          >
            {section === "torneos" && (
              <TournamentsSection
                invitations={invitations}
                upcoming={upcoming}
                played={played}
                userId={user.id}
              />
            )}
            {section === "avisos" && (
              <NotificationsSection notifications={notifications} />
            )}
            {section === "datos" && (
              <div className="divide-y divide-border">
                <SubSection
                  title="Foto de perfil"
                  description="La ven los jugadores que te buscan para armar pareja."
                >
                  <AvatarUpload
                    userId={user.id}
                    name={name}
                    avatarUrl={user.avatarUrl}
                  />
                </SubSection>
                <SubSection
                  title="Datos personales"
                  description="Con tu usuario te invitan a jugar; el teléfono lo usa el organizador."
                >
                  <div className="max-w-md">
                    <ProfileForm
                      email={user.email}
                      fullName={name}
                      phone={profile?.phone ?? ""}
                      username={profile?.username ?? user.username ?? ""}
                      category={profile?.category ?? null}
                    />
                  </div>
                </SubSection>
                <SubSection title="Seguridad">
                  <div className="space-y-3">
                    <ActionRow
                      icon={KeyRound}
                      title="Contraseña"
                      text="Cambiala cuando quieras."
                    >
                      <ButtonLink
                        href="/mi-cuenta/contrasena"
                        variant="outline"
                        size="sm"
                      >
                        Cambiar
                      </ButtonLink>
                    </ActionRow>
                    {user.isAdmin && (
                      <ActionRow
                        icon={LayoutDashboard}
                        title="Panel de administración"
                        text="Torneos, jugadores, usuarios y puntos."
                        className="lg:hidden"
                      >
                        <ButtonLink href="/admin" size="sm">
                          Abrir
                        </ButtonLink>
                      </ActionRow>
                    )}
                    <ActionRow
                      icon={LogOut}
                      title="Sesión"
                      text={`Ingresaste como ${user.email}.`}
                    >
                      <form action={signOut}>
                        <SubmitButton
                          variant="outline"
                          size="sm"
                          pendingLabel="Saliendo…"
                        >
                          Cerrar sesión
                        </SubmitButton>
                      </form>
                    </ActionRow>
                  </div>
                </SubSection>
              </div>
            )}
          </SectionPanel>
        </div>
      </Container>
    </>
  );
}

function SummaryTile({
  href,
  value,
  label,
  highlight = false,
}: {
  href: string;
  value: number | string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        scroll={false}
        className={cn(
          "flex h-full flex-col rounded-card border p-3 transition-colors sm:p-4",
          highlight
            ? "border-oro-400/60 bg-oro-400/10 hover:bg-oro-400/20"
            : "border-white/10 bg-white/5 hover:bg-white/10",
        )}
      >
        <span
          className={cn(
            "font-display text-3xl leading-none font-bold tabular-nums sm:text-4xl",
            highlight && "text-oro-400",
          )}
        >
          {value}
        </span>
        <span className="mt-1 text-xs leading-tight text-noche-300 sm:text-sm">
          {label}
        </span>
      </Link>
    </li>
  );
}

/** Marco de cada sección: título con ícono arriba y el contenido debajo. */
function SectionPanel({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-4 sm:px-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-noche-950 text-oro-400">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-2xl leading-none font-bold uppercase">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function SubSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="p-4 sm:p-6">
      <h3 className="font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ActionRow({
  icon: Icon,
  title,
  text,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border p-3 sm:p-4",
        className,
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground-soft">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="truncate text-sm text-muted-foreground">{text}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** Título chico de un grupo dentro de una sección, con la cantidad. */
function GroupTitle({ title, count }: { title: string; count: number }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
      {title}
      <span className="rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] tracking-normal text-foreground-soft tabular-nums">
        {count}
      </span>
    </h3>
  );
}

function TournamentsSection({
  invitations,
  upcoming,
  played,
  userId,
}: {
  invitations: RegistrationWithTournament[];
  upcoming: RegistrationWithTournament[];
  played: RegistrationWithTournament[];
  userId: string;
}) {
  if (invitations.length + upcoming.length + played.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          icon={Trophy}
          title="Todavía no te anotaste en ningún torneo"
          description="Elegí un torneo con inscripciones abiertas y anotate con tu pareja."
          action={<ButtonLink href="/torneos">Ver torneos</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6">
      {invitations.length > 0 && (
        <section id="invitaciones" className="scroll-mt-32 space-y-3">
          <GroupTitle title="Te invitaron a jugar" count={invitations.length} />
          <ul className="space-y-3">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="space-y-4 rounded-card border-2 border-oro-300 bg-oro-50 p-4 sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <MailOpen
                    className="mt-1 size-5 shrink-0 text-oro-700"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/torneos/${invitation.tournament.slug}`}
                      className="font-display text-2xl leading-tight font-bold uppercase transition-colors hover:text-accent"
                    >
                      {invitation.tournament.name}
                    </Link>
                    <p className="text-sm text-foreground-soft">
                      {invitation.player?.full_name || "Un jugador"} te invitó ·{" "}
                      {formatDateRange(
                        invitation.tournament.starts_on,
                        invitation.tournament.ends_on,
                      )}{" "}
                      · {invitation.tournament.city}
                    </p>
                  </div>
                </div>
                <PairPlayers
                  player={invitation.player}
                  partner={invitation.partner}
                  partnerName={invitation.partner_name}
                  meId={userId}
                  className="rounded-lg bg-surface p-3"
                />
                <InvitationResponse
                  registrationId={invitation.id}
                  slug={invitation.tournament.slug}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <GroupTitle title="Próximos" count={upcoming.length} />
        {upcoming.length > 0 ? (
          <ul className="space-y-3">
            {upcoming.map((registration) => (
              <li key={registration.id}>
                <RegistrationCard registration={registration} userId={userId} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-border-strong px-4 py-5 text-sm text-muted-foreground">
            No tenés torneos por jugar.{" "}
            <Link
              href="/torneos"
              className="font-semibold text-accent hover:text-accent-hover"
            >
              Ver torneos con inscripción abierta
            </Link>
          </p>
        )}
      </section>

      {played.length > 0 && (
        <section className="space-y-3">
          <GroupTitle title="Jugados" count={played.length} />
          <ul className="divide-y divide-border overflow-hidden rounded-card border border-border">
            {played.map((registration) => (
              <li key={registration.id}>
                <Link
                  href={`/torneos/${registration.tournament.slug}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
                >
                  <History
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {registration.tournament.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDateRange(
                        registration.tournament.starts_on,
                        registration.tournament.ends_on,
                      )}
                      {registration.tournament.champions &&
                        ` · Campeones: ${registration.tournament.champions}`}
                    </span>
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function RegistrationCard({
  registration,
  userId,
}: {
  registration: RegistrationWithTournament;
  userId: string;
}) {
  const { tournament } = registration;
  const status = registrationStatus(registration.status);
  const isOwner = registration.user_id === userId;
  const canCancel =
    tournament.status === "inscripciones" &&
    ACTIVE_STATUSES.includes(registration.status);
  const partnerName =
    registration.partner?.full_name || registration.partner_name;
  const otherName = isOwner
    ? partnerName
    : registration.player?.full_name || "tu pareja";
  const pendingText =
    registration.status === "invitacion" && isOwner
      ? `Falta que ${partnerName} acepte la invitación.`
      : registration.status === "pendiente"
        ? "Falta que el organizador confirme el lugar."
        : null;

  return (
    <article className="overflow-hidden rounded-card border border-border">
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <Link
            href={`/torneos/${tournament.slug}`}
            className="font-display text-2xl leading-tight font-bold uppercase transition-colors hover:text-accent"
          >
            {tournament.name}
          </Link>
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground-soft">
            <li className="flex items-center gap-1.5">
              <CalendarDays
                className="size-4 shrink-0 text-noche-400"
                aria-hidden="true"
              />
              {formatDateRange(tournament.starts_on, tournament.ends_on)}
            </li>
            <li className="flex items-center gap-1.5">
              <MapPin
                className="size-4 shrink-0 text-noche-400"
                aria-hidden="true"
              />
              {tournament.city}
            </li>
          </ul>
          <p className="mt-1 text-xs text-muted-foreground">
            {tournament.category} · {tournamentStatus(tournament.status).label}
          </p>
        </div>
        <Badge tone={status.tone} className="shrink-0">
          {status.label}
        </Badge>
      </div>

      {pendingText && (
        <p className="mx-4 mb-4 rounded-lg bg-oro-50 px-3 py-2 text-sm font-medium text-oro-800 sm:mx-5">
          {pendingText}
        </p>
      )}

      <div className="border-t border-border bg-muted/40 px-4 py-3 sm:px-5">
        <PairPlayers
          player={registration.player}
          partner={registration.partner}
          partnerName={registration.partner_name}
          meId={userId}
        />
      </div>

      {canCancel && (
        <form
          action={cancelRegistration.bind(
            null,
            registration.id,
            tournament.slug,
          )}
          className="flex justify-end border-t border-border px-2 py-2 sm:px-3"
        >
          <ConfirmSubmitButton
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger-soft hover:text-danger"
            pendingLabel="Cancelando…"
            confirmMessage={
              registration.status === "invitacion"
                ? `¿Retirar la invitación a ${partnerName}?`
                : `¿Cancelar la inscripción? Le avisamos a ${otherName}.`
            }
          >
            {registration.status === "invitacion"
              ? "Retirar invitación"
              : "Cancelar inscripción"}
          </ConfirmSubmitButton>
        </form>
      )}
    </article>
  );
}

function NotificationsSection({
  notifications,
}: {
  notifications: Notification[];
}) {
  if (notifications.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          icon={Bell}
          title="No tenés avisos"
          description="Te avisamos acá cuando te inviten a jugar o cuando confirmen tu inscripción."
        />
      </div>
    );
  }

  const hasUnread = notifications.some((notification) => !notification.read_at);

  return (
    <>
      {hasUnread && <MarkNotificationsRead />}
      <ul className="divide-y divide-border">
        {notifications.map((notification) => {
          const unread = !notification.read_at;
          const content = (
            <>
              <span
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  unread ? "bg-primary" : "bg-transparent",
                )}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{notification.title}</span>
                  {unread && <Badge tone="primary">Nuevo</Badge>}
                </span>
                {notification.body && (
                  <span className="mt-0.5 block text-sm text-foreground-soft">
                    {notification.body}
                  </span>
                )}
                <span className="mt-1 block text-xs text-muted-foreground">
                  {formatDate(notification.created_at)}
                </span>
              </span>
            </>
          );
          return (
            <li key={notification.id} className={cn(unread && "bg-pista-50")}>
              {notification.href && notification.href !== "/mi-cuenta" ? (
                <Link
                  href={notification.href}
                  className="flex gap-3 px-4 py-4 transition-colors hover:bg-muted sm:px-6"
                >
                  {content}
                  <ChevronRight
                    className="mt-1 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              ) : (
                <div className="flex gap-3 px-4 py-4 sm:px-6">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
