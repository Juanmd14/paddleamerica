import {
  Bell,
  CalendarDays,
  KeyRound,
  LayoutDashboard,
  MapPin,
  Trophy,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { cancelRegistration } from "@/app/torneos/[slug]/actions";
import { EmptyState } from "@/components/empty-state";
import { MarkNotificationsRead } from "@/components/mark-notifications-read";
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
import {
  getMyNotifications,
  getMyProfile,
  getMyRegistrations,
} from "@/lib/data";
import { formatDate, formatDateRange } from "@/lib/format";
import { registrationStatus, tournamentStatus } from "@/lib/labels";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn, firstParam } from "@/lib/utils";
import type { Notification, RegistrationWithTournament } from "@/types/models";

export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: { index: false },
};

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

  const [profile, registrations, notifications, params] = await Promise.all([
    getMyProfile(),
    getMyRegistrations(),
    getMyNotifications(),
    searchParams,
  ]);
  const message = firstParam(params.message);
  const name = profile?.full_name || user.name;

  return (
    <>
      <section className="bg-noche-950 text-white">
        <Container className="flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:py-16">
          <Avatar
            name={name}
            size="lg"
            className="bg-noche-800 ring-2 ring-oro-400"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-[0.25em] text-oro-400 uppercase">
              Mi cuenta
            </p>
            <h1 className="mt-2 font-display text-4xl leading-none font-bold uppercase sm:text-5xl">
              Hola, {name}
            </h1>
            <p className="mt-2 truncate text-noche-300">{user.email}</p>
          </div>
          <form action={signOut}>
            <SubmitButton variant="inverse" size="sm" pendingLabel="Saliendo…">
              Cerrar sesión
            </SubmitButton>
          </form>
        </Container>
      </section>

      <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-3">
        {message && (
          <Alert tone="success" className="lg:col-span-3">
            {message}
          </Alert>
        )}

        <div className="space-y-12 lg:col-span-2">
          <Notifications notifications={notifications} />

          <section>
            <h2 className="font-display text-3xl font-bold uppercase">
              Mis inscripciones
            </h2>
            {registrations.length > 0 ? (
              <ul className="mt-6 space-y-4">
                {registrations.map((registration) => (
                  <li key={registration.id}>
                    <RegistrationCard registration={registration} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-6">
                <EmptyState
                  icon={Trophy}
                  title="Todavía no te anotaste en ningún torneo"
                  description="Elegí un torneo con inscripciones abiertas y anotate con tu pareja."
                  action={<ButtonLink href="/torneos">Ver torneos</ButtonLink>}
                />
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          {user.isAdmin && (
            <Card className="flex items-center justify-between gap-4 border-oro-300 bg-oro-50 p-6">
              <div>
                <h2 className="font-semibold">Panel de administración</h2>
                <p className="text-sm text-muted-foreground">
                  Torneos, noticias, jugadores y puntos.
                </p>
              </div>
              <ButtonLink href="/admin" size="sm">
                <LayoutDashboard className="size-4" aria-hidden="true" />
                Abrir
              </ButtonLink>
            </Card>
          )}
          <Card className="p-6">
            <h2 className="font-display text-2xl font-bold uppercase">
              Mis datos
            </h2>
            <div className="mt-5">
              <ProfileForm
                email={user.email}
                fullName={name}
                phone={profile?.phone ?? ""}
              />
            </div>
          </Card>
          <Card className="flex items-center justify-between gap-4 p-6">
            <div>
              <h2 className="font-semibold">Contraseña</h2>
              <p className="text-sm text-muted-foreground">
                Cambiala cuando quieras.
              </p>
            </div>
            <ButtonLink
              href="/mi-cuenta/contrasena"
              variant="outline"
              size="sm"
            >
              <KeyRound className="size-4" aria-hidden="true" />
              Cambiar
            </ButtonLink>
          </Card>
        </aside>
      </Container>
    </>
  );
}

function RegistrationCard({
  registration,
}: {
  registration: RegistrationWithTournament;
}) {
  const { tournament } = registration;
  const status = registrationStatus(registration.status);
  const canCancel =
    tournament.status === "inscripciones" &&
    (registration.status === "pendiente" ||
      registration.status === "confirmada");

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/torneos/${tournament.slug}`}
            className="font-display text-2xl leading-tight font-bold uppercase transition-colors hover:text-accent"
          >
            {tournament.name}
          </Link>
          <p className="text-sm text-muted-foreground">
            {tournament.category} · {tournamentStatus(tournament.status).label}
          </p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <ul className="mt-4 grid gap-2 text-sm text-foreground-soft sm:grid-cols-3">
        <li className="flex items-center gap-2">
          <Users
            className="size-4 shrink-0 text-noche-400"
            aria-hidden="true"
          />
          Con {registration.partner_name}
        </li>
        <li className="flex items-center gap-2">
          <CalendarDays
            className="size-4 shrink-0 text-noche-400"
            aria-hidden="true"
          />
          {formatDateRange(tournament.starts_on, tournament.ends_on)}
        </li>
        <li className="flex items-center gap-2">
          <MapPin
            className="size-4 shrink-0 text-noche-400"
            aria-hidden="true"
          />
          {tournament.city}
        </li>
      </ul>

      {canCancel && (
        <form
          action={cancelRegistration.bind(
            null,
            registration.id,
            tournament.slug,
          )}
          className="mt-4 border-t border-border pt-4"
        >
          <SubmitButton variant="ghost" size="sm" pendingLabel="Cancelando…">
            Cancelar inscripción
          </SubmitButton>
        </form>
      )}
    </Card>
  );
}

function Notifications({ notifications }: { notifications: Notification[] }) {
  const hasUnread = notifications.some((notification) => !notification.read_at);

  return (
    <section id="avisos" className="scroll-mt-24">
      <h2 className="font-display text-3xl font-bold uppercase">Avisos</h2>
      {notifications.length > 0 ? (
        <Card className="mt-6 overflow-hidden">
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
                      <span className="font-semibold">
                        {notification.title}
                      </span>
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
                <li
                  key={notification.id}
                  className={cn(unread && "bg-oro-50/60")}
                >
                  {notification.href && notification.href !== "/mi-cuenta" ? (
                    <Link
                      href={notification.href}
                      className="flex gap-3 px-5 py-4 hover:bg-muted"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="flex gap-3 px-5 py-4">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={Bell}
            title="No tenés avisos"
            description="Te avisamos acá (y por email) cuando confirmen o rechacen una inscripción."
          />
        </div>
      )}
    </section>
  );
}
