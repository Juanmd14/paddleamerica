import {
  ArrowLeft,
  CalendarDays,
  CircleCheck,
  type LucideIcon,
  MapPin,
  Medal,
  Navigation,
  Trophy,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cancelRegistration } from "@/app/torneos/[slug]/actions";
import { Cover } from "@/components/cover";
import { RegistrationForm } from "@/components/registration-form";
import { ShareButton } from "@/components/share-button";
import { FlyerPlaceholder } from "@/components/tournament-card";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import { getMyProfile, getMyRegistration, getTournament } from "@/lib/data";
import { formatDateRange } from "@/lib/format";
import {
  genderLabel,
  registrationStatus,
  tournamentStatus,
} from "@/lib/labels";
import { paragraphs } from "@/lib/utils";
import type { Tournament } from "@/types/models";

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

  const status = tournamentStatus(tournament.status);
  const dates = formatDateRange(tournament.starts_on, tournament.ends_on);
  const place = [tournament.venue, tournament.city].filter(Boolean).join(", ");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;

  const details: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: CalendarDays, label: "Fechas", value: dates },
    { icon: MapPin, label: "Sede", value: place },
    {
      icon: Users,
      label: "Categoría",
      value: `${tournament.category} · ${genderLabel(tournament.gender)}`,
    },
  ];
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
        <Container className="py-12 sm:py-16">
          <Link
            href="/torneos"
            className="inline-flex items-center gap-2 text-sm font-medium text-noche-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Todos los torneos
          </Link>
          <div className="mt-8 flex flex-wrap gap-2">
            <Badge tone={status.tone}>{status.label}</Badge>
            <Badge tone="inverse">{genderLabel(tournament.gender)}</Badge>
          </div>
          <h1 className="mt-4 max-w-4xl font-display text-5xl leading-none font-bold uppercase sm:text-7xl">
            {tournament.name}
          </h1>
          <p className="mt-4 text-lg text-noche-300">
            {dates} · {tournament.city}
          </p>
        </Container>
      </section>

      <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <Cover
            src={tournament.cover_url}
            alt={`Flyer de ${tournament.name}`}
            ratio="flyer"
            seed={tournament.id}
            preload
            className="rounded-card lg:sticky lg:top-24"
            sizes="(min-width: 1024px) 460px, 100vw"
            placeholder={<FlyerPlaceholder tournament={tournament} />}
          />
        </div>

        <div className="space-y-8 lg:col-span-7">
          <Card className="p-6 sm:p-8">
            <h2 className="font-display text-2xl font-bold uppercase">
              Información
            </h2>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3">
                  <Icon
                    className="mt-0.5 size-5 shrink-0 text-accent"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({ variant: "outline" })}
              >
                <Navigation className="size-4" aria-hidden="true" />
                Cómo llegar
              </a>
              <ShareButton
                title={tournament.name}
                text={`${tournament.name} · ${dates} en ${tournament.city}`}
              />
            </div>
          </Card>

          {tournament.status === "inscripciones" && (
            <Card id="inscripcion" className="scroll-mt-24 p-6 sm:p-8">
              <h2 className="font-display text-2xl font-bold uppercase">
                Inscripción
              </h2>
              <div className="mt-6">
                <Suspense fallback={<RegistrationSkeleton />}>
                  <RegistrationPanel tournament={tournament} />
                </Suspense>
              </div>
            </Card>
          )}

          {tournament.description && (
            <section>
              <h2 className="font-display text-2xl font-bold uppercase">
                Sobre el torneo
              </h2>
              <div className="mt-4 space-y-5 text-lg leading-8 text-foreground-soft">
                {paragraphs(tournament.description).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}
        </div>
      </Container>
    </>
  );
}

async function RegistrationPanel({ tournament }: { tournament: Tournament }) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div>
        <p className="text-foreground-soft">
          Para anotarte con tu pareja necesitás una cuenta. Es gratis y te lleva
          un minuto.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink
            href={`/login?modo=registro&next=/torneos/${tournament.slug}%23inscripcion`}
            size="lg"
          >
            Crear cuenta e inscribirme
          </ButtonLink>
          <ButtonLink
            href={`/login?next=/torneos/${tournament.slug}%23inscripcion`}
            size="lg"
            variant="outline"
          >
            Ya tengo cuenta
          </ButtonLink>
        </div>
      </div>
    );
  }

  const [registration, profile] = await Promise.all([
    getMyRegistration(tournament.id),
    getMyProfile(),
  ]);

  if (registration) {
    const status = registrationStatus(registration.status);
    return (
      <div>
        <div className="flex items-start gap-3 rounded-lg bg-success-soft p-4 text-success">
          <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p className="font-medium">
            Ya estás inscripto con {registration.partner_name}.
          </p>
        </div>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
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
          {registration.category && (
            <div>
              <dt className="text-muted-foreground">Categoría</dt>
              <dd className="mt-1 font-medium">{registration.category}</dd>
            </div>
          )}
        </dl>
        <form
          action={cancelRegistration.bind(
            null,
            registration.id,
            tournament.slug,
          )}
          className="mt-6 border-t border-border pt-6"
        >
          <SubmitButton variant="ghost" size="sm" pendingLabel="Cancelando…">
            Cancelar inscripción
          </SubmitButton>
        </form>
      </div>
    );
  }

  return (
    <RegistrationForm
      slug={tournament.slug}
      categoryHint={tournament.category}
      defaultPhone={profile?.phone}
    />
  );
}

function RegistrationSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-13 w-full rounded-full" />
    </div>
  );
}
