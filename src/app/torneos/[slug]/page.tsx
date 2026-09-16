import {
  ArrowLeft,
  CalendarDays,
  CircleCheck,
  CircleX,
  Clock,
  Info,
  type LucideIcon,
  MapPin,
  Medal,
  Trophy,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelRegistration } from "@/app/torneos/[slug]/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { Cover } from "@/components/cover";
import { InvitationResponse } from "@/components/invitation-response";
import { PairPlayers } from "@/components/pair-players";
import { RegistrationForm } from "@/components/registration-form";
import {
  MobileRegistrationBar,
  RegistrationToggle,
} from "@/components/registration-toggle";
import { SpotsBar } from "@/components/spots-bar";
import { FlyerPlaceholder } from "@/components/tournament-card";
import { TournamentMap } from "@/components/tournament-map";
import { TournamentStatusBadge } from "@/components/tournament-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { type CurrentUser, getCurrentUser } from "@/lib/auth";
import {
  categoryName,
  categoryRulesHelp,
  categoryRulesLabel,
  playerCategoryError,
} from "@/lib/categories";
import {
  getMyProfile,
  getMyTournamentEntry,
  getTournament,
  getTournamentSpots,
  type MyTournamentEntry,
} from "@/lib/data";
import { formatDateRange, formatShortDate } from "@/lib/format";
import {
  featuredLabel,
  genderLabel,
  registrationStatus,
  type SpotsInfo,
  spotsInfo,
} from "@/lib/labels";
import { cn, paragraphs } from "@/lib/utils";
import type {
  Profile,
  RegistrationWithPeople,
  Tournament,
} from "@/types/models";

export async function generateMetadata({
  params,
}: PageProps<"/torneos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tournament = await getTournament(slug);
  if (!tournament) return { title: "Torneo no encontrado" };

  const dates = formatDateRange(tournament.starts_on, tournament.ends_on);
  return {
    title: tournament.name,
    description: `${dates} en ${[tournament.venue, tournament.city].filter(Boolean).join(", ")}. ${tournament.category} · ${genderLabel(tournament.gender)}.`,
  };
}

export default async function TournamentPage({
  params,
}: PageProps<"/torneos/[slug]">) {
  const { slug } = await params;
  const tournament = await getTournament(slug);
  if (!tournament) notFound();

  const [spotsMap, user] = await Promise.all([
    getTournamentSpots(),
    getCurrentUser(),
  ]);
  const [entry, profile] = user
    ? await Promise.all([getMyTournamentEntry(tournament.id), getMyProfile()])
    : [{ registration: null, invitations: [] }, null];

  const spots = spotsInfo(tournament.capacity, spotsMap.get(tournament.id));
  const dates = formatDateRange(tournament.starts_on, tournament.ends_on);
  const isOpen = tournament.status === "inscripciones";
  const showMobileBar =
    isOpen &&
    !entry.registration &&
    entry.invitations.length === 0 &&
    !spots?.full;

  const details: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: CalendarDays, label: "Fechas", value: dates },
    {
      icon: MapPin,
      label: "Sede",
      value: [tournament.venue, tournament.city].filter(Boolean).join(", "),
    },
    {
      icon: Users,
      label: "Categoría",
      value: `${tournament.category} · ${genderLabel(tournament.gender)}`,
    },
  ];
  if (tournament.capacity) {
    details.push({
      icon: Users,
      label: "Cupo",
      value: `${tournament.capacity} parejas`,
    });
  }
  if (tournament.prize) {
    details.push({ icon: Medal, label: "Premios", value: tournament.prize });
  }
  if (tournament.champions) {
    details.push({
      icon: Trophy,
      label: "Campeones",
      value: tournament.champions,
    });
  }

  return (
    <>
      <section className="bg-noche-950 text-white">
        <Container className="py-10 sm:py-14">
          <Link
            href="/torneos"
            className="inline-flex items-center gap-2 text-sm font-medium text-noche-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Todos los torneos
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <TournamentStatusBadge status={tournament.status} />
            {featuredLabel(tournament) && (
              <Badge tone="primary">{featuredLabel(tournament)}</Badge>
            )}
            <Badge tone="inverse">{genderLabel(tournament.gender)}</Badge>
            <Badge tone="inverse">{tournament.category}</Badge>
          </div>
          <h1 className="mt-4 max-w-4xl font-display text-5xl leading-none font-bold uppercase sm:text-7xl">
            {tournament.name}
          </h1>
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-lg text-noche-300">
            <span className="inline-flex items-center gap-2">
              <CalendarDays
                className="size-5 text-oro-400"
                aria-hidden="true"
              />
              {dates}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-5 text-oro-400" aria-hidden="true" />
              {[tournament.venue, tournament.city].filter(Boolean).join(", ")}
            </span>
          </p>
        </Container>
      </section>

      <Container
        className={
          showMobileBar
            ? "grid gap-8 pt-8 pb-24 sm:pt-12 lg:grid-cols-12 lg:gap-12 lg:pb-16"
            : "grid gap-8 py-8 sm:py-12 lg:grid-cols-12 lg:gap-12 lg:py-16"
        }
      >
        <aside className="lg:col-span-5">
          <div className="space-y-5 lg:sticky lg:top-24">
            <Cover
              src={tournament.cover_url}
              alt={`Flyer de ${tournament.name}`}
              ratio="flyer"
              seed={tournament.id}
              preload
              className="rounded-card shadow-xl shadow-noche-900/10"
              sizes="(min-width: 1024px) 460px, 100vw"
              placeholder={<FlyerPlaceholder tournament={tournament} />}
            />
            <RegistrationCard
              tournament={tournament}
              spots={spots}
              user={user}
              entry={entry}
              profile={profile}
            />
          </div>
        </aside>

        <div className="space-y-10 lg:col-span-7">
          {tournament.description && (
            <section>
              <h2 className="font-display text-3xl font-bold uppercase">
                Sobre el torneo
              </h2>
              <div className="mt-4 space-y-5 text-lg leading-8 text-foreground-soft">
                {paragraphs(tournament.description).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="font-display text-3xl font-bold uppercase">
              Información
            </h2>
            <Card className="mt-4 p-5 sm:p-6">
              <dl className="grid gap-5 sm:grid-cols-2">
                {details.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pista-50 text-accent">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="font-semibold">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </Card>
          </section>

          <section>
            <h2 className="font-display text-3xl font-bold uppercase">
              Ubicación
            </h2>
            <div className="mt-4">
              <TournamentMap
                tournament={tournament}
                shareText={`${tournament.name} · ${dates} en ${tournament.city}`}
              />
            </div>
          </section>
        </div>
      </Container>

      {showMobileBar && (
        <MobileRegistrationBar
          summary={
            spots
              ? `${spots.taken}/${spots.capacity} parejas · ${spots.left === 1 ? "queda 1 lugar" : `quedan ${spots.left}`}`
              : "Inscripciones abiertas"
          }
        />
      )}
    </>
  );
}

type RegistrationCardProps = {
  tournament: Tournament;
  spots: SpotsInfo | null;
  user: CurrentUser | null;
  entry: MyTournamentEntry;
  profile: Profile | null;
};

/** Tarjeta de inscripción debajo del flyer, según el estado del torneo y del usuario. */
function RegistrationCard({
  tournament,
  spots,
  user,
  entry,
  profile,
}: RegistrationCardProps) {
  const isOpen = tournament.status === "inscripciones";
  const title = isOpen
    ? entry.registration
      ? "Tu inscripción"
      : entry.invitations.length > 0
        ? "Te invitaron a jugar"
        : spots?.full
          ? "Cupo completo"
          : "Anotate con tu pareja"
    : tournament.status === "proximo"
      ? "Inscripciones próximamente"
      : tournament.status === "en_juego"
        ? "Torneo en juego"
        : "Torneo finalizado";

  return (
    <Card id="inscripcion" className="scroll-mt-24 overflow-hidden shadow-lg">
      <div className="bg-noche-950 p-5 text-white sm:p-6">
        <p className="text-xs font-semibold tracking-[0.25em] text-oro-400 uppercase">
          Inscripción
        </p>
        <h2 className="mt-1 font-display text-3xl leading-none font-bold uppercase">
          {title}
        </h2>
        {spots && (isOpen || tournament.status === "proximo") && (
          <SpotsBar spots={spots} tone="dark" className="mt-5" />
        )}
      </div>

      <div className="p-5 sm:p-6">
        {isOpen ? (
          <OpenRegistration
            tournament={tournament}
            spots={spots}
            user={user}
            entry={entry}
            profile={profile}
          />
        ) : tournament.status === "proximo" ? (
          <p className="flex items-start gap-3 text-foreground-soft">
            <Clock
              className="mt-0.5 size-5 shrink-0 text-accent"
              aria-hidden="true"
            />
            {tournament.registration_opens_on
              ? `Las inscripciones abren el ${formatShortDate(tournament.registration_opens_on)}. Volvé ese día para anotarte.`
              : "Las inscripciones todavía no abrieron. Seguinos para enterarte cuándo arrancan."}
          </p>
        ) : tournament.champions ? (
          <p className="flex items-center gap-3 font-semibold">
            <Trophy
              className="size-5 shrink-0 text-oro-500"
              aria-hidden="true"
            />
            Campeones: {tournament.champions}
          </p>
        ) : (
          <p className="text-foreground-soft">
            Las inscripciones de este torneo están cerradas.
          </p>
        )}
      </div>
    </Card>
  );
}

function OpenRegistration({
  tournament,
  spots,
  user,
  entry,
  profile,
}: RegistrationCardProps) {
  const { registration, invitations } = entry;

  if (user && registration) {
    return (
      <MyRegistration
        registration={registration}
        tournament={tournament}
        userId={user.id}
      />
    );
  }

  if (user && invitations.length > 0) {
    return (
      <div className="space-y-4">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="space-y-4 rounded-lg border border-oro-300 bg-oro-50 p-4"
          >
            <p className="font-medium">
              {invitation.player?.full_name || "Un jugador"} te invitó a jugar
              este torneo.
            </p>
            <PairPlayers
              player={invitation.player}
              partner={invitation.partner}
              partnerName={invitation.partner_name}
              meId={user.id}
            />
            <InvitationResponse
              registrationId={invitation.id}
              slug={tournament.slug}
            />
          </div>
        ))}
        <p className="text-sm text-muted-foreground">
          Al aceptar quedan anotados y el organizador confirma el lugar. Si
          preferís jugar con otra pareja, rechazá y anotate vos.
        </p>
      </div>
    );
  }

  if (spots?.full) {
    return (
      <div className="space-y-3">
        <Button size="lg" className="w-full" disabled>
          Cupo completo
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Si se libera un lugar, vas a poder anotarte desde acá.
        </p>
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(`/torneos/${tournament.slug}#inscripcion`);
    return (
      <div className="space-y-3">
        <ButtonLink
          href={`/login?modo=registro&next=${next}`}
          size="lg"
          className="w-full"
        >
          Inscribirme
        </ButtonLink>
        <p className="text-center text-sm text-muted-foreground">
          Necesitás una cuenta (es gratis), y tu pareja también.{" "}
          <Link
            href={`/login?next=${next}`}
            className="font-semibold text-accent hover:text-accent-hover"
          >
            Ya tengo cuenta
          </Link>
        </p>
      </div>
    );
  }

  const myCategory = profile?.category ?? null;
  const ownError = playerCategoryError(tournament, myCategory);
  const rules = categoryRulesLabel(tournament) && (
    <p className="flex items-start gap-2 rounded-lg bg-pista-50 px-3 py-2.5 text-sm text-pista-800">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>
        {categoryRulesHelp(tournament)}
        {myCategory && ` Vos sos ${categoryName(myCategory)}.`}
      </span>
    </p>
  );

  if (ownError) {
    return (
      <div className="space-y-4">
        {rules}
        <div className="flex items-start gap-3 rounded-lg bg-danger-soft p-4 text-danger">
          <CircleX className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p className="font-medium">{ownError}</p>
        </div>
      </div>
    );
  }

  return (
    <RegistrationToggle>
      <div className="space-y-5">
        {rules}
        <RegistrationForm
          slug={tournament.slug}
          defaultPhone={profile?.phone}
        />
      </div>
    </RegistrationToggle>
  );
}

/** Lo que ve cada jugador de la pareja según en qué paso está la inscripción. */
function MyRegistration({
  registration,
  tournament,
  userId,
}: {
  registration: RegistrationWithPeople;
  tournament: Tournament;
  userId: string;
}) {
  const status = registrationStatus(registration.status);
  const isOwner = registration.user_id === userId;
  const partnerName =
    registration.partner?.full_name || registration.partner_name;
  const otherName = isOwner
    ? partnerName
    : registration.player?.full_name || "tu pareja";

  const steps: Record<
    string,
    { icon: LucideIcon; className: string; text: string }
  > = {
    invitacion: {
      icon: Clock,
      className: "bg-oro-50 text-oro-800",
      text: `Invitaste a ${partnerName}. Falta que acepte la invitación; le llegó un aviso.`,
    },
    pendiente: {
      icon: Clock,
      className: "bg-oro-50 text-oro-800",
      text: `Ya están anotados con ${otherName}. Falta que el organizador confirme el lugar.`,
    },
    confirmada: {
      icon: CircleCheck,
      className: "bg-success-soft text-success",
      text: `¡Lugar confirmado! Juegan con ${otherName}.`,
    },
    rechazada: {
      icon: CircleX,
      className: "bg-danger-soft text-danger",
      text: `La inscripción con ${otherName} fue rechazada. Si tenés dudas, escribile a la organización.`,
    },
  };
  const step = steps[registration.status] ?? steps.pendiente;
  const canCancel = ["invitacion", "pendiente", "confirmada"].includes(
    registration.status,
  );

  return (
    <div className="space-y-5">
      <div
        className={cn("flex items-start gap-3 rounded-lg p-4", step.className)}
      >
        <step.icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p className="font-medium">{step.text}</p>
      </div>
      <PairPlayers
        player={registration.player}
        partner={registration.partner}
        partnerName={registration.partner_name}
        meId={userId}
      />
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Estado</dt>
          <dd className="mt-1">
            <Badge tone={status.tone}>{status.label}</Badge>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Teléfono de contacto</dt>
          <dd className="mt-1 font-medium">{registration.contact_phone}</dd>
        </div>
      </dl>
      {canCancel && (
        <form
          action={cancelRegistration.bind(
            null,
            registration.id,
            tournament.slug,
          )}
          className="border-t border-border pt-4"
        >
          <ConfirmSubmitButton
            variant="ghost"
            size="sm"
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
    </div>
  );
}
