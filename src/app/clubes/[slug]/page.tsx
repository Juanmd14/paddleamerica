import { ArrowLeft, AtSign, CalendarDays, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { courtsLabel } from "@/components/club-card";
import { Cover } from "@/components/cover";
import { EmptyState } from "@/components/empty-state";
import { SectionHeading } from "@/components/section-heading";
import {
  TournamentCard,
  TournamentResultCard,
} from "@/components/tournament-card";
import { TournamentMap } from "@/components/tournament-map";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getClub, getClubTournaments, getTournamentSpots } from "@/lib/data";
import { paragraphs } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/clubes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const club = await getClub(slug);
  if (!club) return { title: "Club no encontrado" };

  return {
    title: club.name,
    description:
      club.description?.slice(0, 160) ??
      `${club.name}, club de pádel en ${club.city}. Cómo llegar y próximos torneos.`,
  };
}

export default async function ClubPage({
  params,
}: PageProps<"/clubes/[slug]">) {
  const { slug } = await params;
  const club = await getClub(slug);
  if (!club) notFound();

  const [{ upcoming, finished }, spots] = await Promise.all([
    getClubTournaments(club.id),
    getTournamentSpots(),
  ]);
  const instagram = club.instagram?.replace(/^@/, "");

  return (
    <>
      <section className="bg-noche-950 text-white">
        <Container className="grid gap-8 py-10 sm:py-14 lg:grid-cols-12 lg:items-center lg:gap-12">
          <div className="lg:col-span-7">
            <Link
              href="/clubes"
              className="inline-flex items-center gap-2 text-sm font-medium text-noche-300 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Todos los clubes
            </Link>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge tone="inverse">{club.city}</Badge>
              {club.courts ? (
                <Badge tone="inverse">{courtsLabel(club.courts)}</Badge>
              ) : null}
              {upcoming.length > 0 ? (
                <Badge tone="primary">
                  {upcoming.length === 1
                    ? "1 torneo en camino"
                    : `${upcoming.length} torneos en camino`}
                </Badge>
              ) : null}
            </div>
            <h1 className="mt-4 font-display text-5xl leading-none font-bold uppercase sm:text-7xl">
              {club.name}
            </h1>
            <p className="mt-4 flex items-center gap-2 text-lg text-noche-300">
              <MapPin className="size-5 text-oro-400" aria-hidden="true" />
              {club.address || club.city}
            </p>
            {/*
              Sin botón de reserva a propósito: más adelante se ofrece como
              servicio pago a los clubes que quieran recibir reservas desde acá.
            */}
            {instagram ? (
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`https://instagram.com/${instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonStyles({ variant: "inverse" })}
                >
                  <AtSign className="size-4" aria-hidden="true" />
                  {instagram}
                </a>
              </div>
            ) : null}
          </div>
          <div className="lg:col-span-5">
            <Cover
              src={club.cover_url}
              alt={`Foto de ${club.name}`}
              seed={club.id}
              preload
              className="rounded-card shadow-xl shadow-black/30"
              sizes="(min-width: 1024px) 480px, 100vw"
            />
          </div>
        </Container>
      </section>

      <Container className="space-y-16 py-12 sm:py-16">
        {club.description ? (
          <section className="max-w-3xl">
            <h2 className="font-display text-3xl font-bold uppercase">
              Sobre el club
            </h2>
            <div className="mt-4 space-y-5 text-lg leading-8 text-foreground-soft">
              {paragraphs(club.description).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <SectionHeading eyebrow="En esta cancha" title="Próximos torneos" />
          {upcoming.length > 0 ? (
            <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {upcoming.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  taken={spots.get(tournament.id)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                icon={CalendarDays}
                title="No hay torneos programados acá"
                description="Cuando se confirme un torneo en este club lo vas a ver en esta sección."
              />
            </div>
          )}
        </section>

        {finished.length > 0 ? (
          <section>
            <SectionHeading
              eyebrow="Ya se jugaron"
              title="Torneos anteriores"
            />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {finished.map((tournament) => (
                <TournamentResultCard
                  key={tournament.id}
                  tournament={tournament}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="font-display text-3xl font-bold uppercase">
            Cómo llegar
          </h2>
          <div className="mt-4">
            <TournamentMap
              tournament={{ ...club, venue: club.name }}
              shareText={`${club.name} · ${club.city}`}
            />
          </div>
        </section>
      </Container>
    </>
  );
}
