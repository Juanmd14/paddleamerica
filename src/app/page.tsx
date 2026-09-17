import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Newspaper,
  Star,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import courtImage from "@/assets/cancha-aerea.webp";
import { CourtLines } from "@/components/court-lines";
import { EmptyState } from "@/components/empty-state";
import { NewsCard } from "@/components/news-card";
import { SectionHeading } from "@/components/section-heading";
import { SpotsBar } from "@/components/spots-bar";
import { TournamentCard } from "@/components/tournament-card";
import { TournamentStatusBadge } from "@/components/tournament-status-badge";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  getHomeStats,
  getNews,
  getRanking,
  getSiteSettings,
  getTournamentSpots,
  getTournaments,
  type HomeStat,
  pickFeaturedTournament,
} from "@/lib/data";
import { currentYear, formatDateRange, formatNumber } from "@/lib/format";
import {
  branchLabel,
  CATEGORIES,
  featuredLabel,
  genderLabel,
  playerName,
  type SpotsInfo,
  spotsInfo,
} from "@/lib/labels";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { Player, Tournament } from "@/types/models";

export default async function Home() {
  const [upcoming, news, men, women, stats, settings, spots] =
    await Promise.all([
      getTournaments(),
      getNews({ limit: 3 }),
      getRanking({ gender: "masculino" }),
      getRanking({ gender: "femenino" }),
      getHomeStats(),
      getSiteSettings(),
      getTournamentSpots(),
    ]);

  const tournaments = upcoming.slice(0, 4);
  const featuredTournament = pickFeaturedTournament(upcoming);
  const [leadNews, ...moreNews] = news;
  // El ranking es por categoría: se muestra el primero de cada una.
  const rankings = [
    { gender: "masculino", leaders: categoryLeaders(men) },
    { gender: "femenino", leaders: categoryLeaders(women) },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-noche-950 text-white">
        <HeroBackground imageUrl={settings.heroImageUrl} />
        <Container className="relative grid gap-12 pt-14 pb-12 sm:pt-20 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-16 lg:pt-24 lg:pb-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-oro-400 uppercase">
              Circuito regional · Temporada {currentYear()}
            </p>
            <h1 className="mt-5 font-display text-6xl leading-[0.9] font-bold uppercase sm:text-7xl lg:text-8xl">
              Todo el pádel <span className="text-oro-400">de la zona</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-noche-300">
              Torneos, ranking y noticias de {siteConfig.region}. Seguí a los
              mejores jugadores y anotate en el próximo torneo desde tu cuenta.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/torneos" size="lg">
                Ver torneos
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="/jugadores" size="lg" variant="inverse">
                Ranking
              </ButtonLink>
            </div>
          </div>
          {featuredTournament && (
            <FeaturedTournament
              tournament={featuredTournament}
              spots={spotsInfo(
                featuredTournament.capacity,
                spots.get(featuredTournament.id),
              )}
            />
          )}
        </Container>

        <StatsStrip stats={stats} />
      </section>

      <Container className="space-y-20 py-16 sm:space-y-24 sm:py-20">
        <section>
          <SectionHeading
            eyebrow="Calendario"
            title="Próximos torneos"
            href="/torneos"
          />
          {tournaments.length > 0 ? (
            <div className="-mx-4 mt-8 scrollbar-none flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:scroll-px-0 sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
              {tournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  taken={spots.get(tournament.id)}
                  className="w-[78%] shrink-0 snap-start sm:w-auto"
                />
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                icon={Trophy}
                title="No hay torneos programados"
                description="Apenas se confirme la próxima fecha la vas a ver acá."
              />
            </div>
          )}
        </section>

        <div className="grid gap-20 lg:grid-cols-3 lg:gap-12">
          <section className="lg:col-span-2">
            <SectionHeading
              eyebrow="Actualidad"
              title="Últimas noticias"
              href="/noticias"
            />
            {leadNews ? (
              <>
                <div className="mt-8">
                  <NewsCard article={leadNews} featured />
                </div>
                {moreNews.length > 0 && (
                  <div className="mt-12 grid gap-10 sm:grid-cols-2">
                    {moreNews.map((article) => (
                      <NewsCard key={article.id} article={article} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="mt-8">
                <EmptyState icon={Newspaper} title="Todavía no hay noticias" />
              </div>
            )}
          </section>

          <aside>
            <SectionHeading
              eyebrow="Ranking"
              title="Líderes por categoría"
              href="/jugadores"
            />
            <div className="mt-8 space-y-6">
              {rankings.map((ranking) => (
                <Card key={ranking.gender} className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h3 className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                      {branchLabel(ranking.gender)}
                    </h3>
                    <Link
                      href={`/jugadores?rama=${ranking.gender}`}
                      className="text-xs font-semibold text-accent transition-colors hover:text-accent-hover"
                    >
                      Ver ranking
                    </Link>
                  </div>
                  {ranking.leaders.length > 0 ? (
                    <ul className="divide-y divide-border">
                      {ranking.leaders.map((player) => (
                        <li key={player.id}>
                          <Link
                            href={`/jugadores?${new URLSearchParams({ rama: ranking.gender, categoria: player.category })}`}
                            className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted"
                          >
                            <span className="w-10 shrink-0 font-display text-lg font-bold text-oro-600 uppercase">
                              {player.category}
                            </span>
                            <Avatar
                              name={playerName(player)}
                              src={player.photo_url}
                              size="sm"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-semibold">
                                {playerName(player)}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {player.club ?? "Líder de la categoría"}
                              </span>
                            </span>
                            <span className="text-right">
                              <span className="block font-display text-lg leading-none font-bold tabular-nums">
                                {formatNumber(player.ranking_points)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                pts
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Todavía no hay jugadores en el ranking.
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </aside>
        </div>

        <JoinBanner />
      </Container>
    </>
  );
}

/** Foto del hero cargada en Panel → Sitio o, si no hay, la cancha aérea a la derecha. */
function HeroBackground({ imageUrl }: { imageUrl: string | null }) {
  if (imageUrl) {
    return (
      <>
        <Image
          src={imageUrl}
          alt=""
          fill
          preload
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-noche-950 via-noche-950/85 to-noche-950/55 lg:bg-linear-to-r lg:from-noche-950 lg:via-noche-950/80 lg:to-noche-950/30"
        />
      </>
    );
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_75%_0%,var(--color-noche-800)_0%,transparent_65%)]"
      />
      <Image
        src={courtImage}
        alt=""
        preload
        sizes="(min-width: 1024px) 40vw, 100vw"
        className="pointer-events-none absolute top-0 right-0 h-full w-full [mask-image:linear-gradient(to_bottom,black,transparent)] object-cover opacity-20 lg:w-[42%] lg:[mask-image:linear-gradient(to_right,transparent,black_45%)] lg:opacity-60"
      />
    </>
  );
}

function FeaturedTournament({
  tournament,
  spots,
}: {
  tournament: Tournament;
  spots: SpotsInfo | null;
}) {
  const isOpen = tournament.status === "inscripciones";
  const featured = featuredLabel(tournament);
  const flyer = tournament.cover_url;

  return (
    <div
      className={cn(
        "relative rounded-card border bg-noche-950/70 p-6 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-8",
        featured ? "border-oro-400/60" : "border-white/10",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-oro-400 uppercase">
          {featured && (
            <Star className="size-3.5 fill-current" aria-hidden="true" />
          )}
          {featured ?? "Próximo torneo"}
        </p>
        <TournamentStatusBadge status={tournament.status} />
      </div>
      <div className="mt-5 flex items-start gap-5">
        {flyer && (
          <Link
            href={`/torneos/${tournament.slug}`}
            className="relative aspect-[4/5] w-28 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/15 sm:w-36"
          >
            <Image
              src={flyer}
              alt={`Flyer de ${tournament.name}`}
              fill
              sizes="144px"
              className="object-cover"
            />
          </Link>
        )}
        <div className="min-w-0">
          <h2
            className={cn(
              "font-display leading-none font-bold uppercase",
              flyer ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl",
            )}
          >
            {tournament.name}
          </h2>
          <p className="mt-2 text-noche-300">
            {tournament.category} · {genderLabel(tournament.gender)}
          </p>
        </div>
      </div>
      <ul className="mt-6 space-y-3 border-t border-white/10 pt-6 text-noche-200">
        <li className="flex items-center gap-3">
          <CalendarDays
            className="size-5 shrink-0 text-oro-400"
            aria-hidden="true"
          />
          {formatDateRange(tournament.starts_on, tournament.ends_on)}
        </li>
        <li className="flex items-center gap-3">
          <MapPin className="size-5 shrink-0 text-oro-400" aria-hidden="true" />
          {[tournament.venue, tournament.city].filter(Boolean).join(", ")}
        </li>
        {tournament.prize && (
          <li className="flex items-center gap-3">
            <Trophy
              className="size-5 shrink-0 text-oro-400"
              aria-hidden="true"
            />
            {tournament.prize}
          </li>
        )}
      </ul>
      {isOpen && spots && (
        <SpotsBar
          spots={spots}
          tone="dark"
          className="mt-6 border-t border-white/10 pt-6"
        />
      )}
      <ButtonLink
        href={`/torneos/${tournament.slug}${isOpen && !spots?.full ? "#inscripcion" : ""}`}
        size="lg"
        className="mt-8 w-full"
      >
        {isOpen && !spots?.full ? "Inscribirme" : "Ver torneo"}
        <ArrowRight className="size-4" aria-hidden="true" />
      </ButtonLink>
    </div>
  );
}

function StatsStrip({ stats }: { stats: HomeStat[] }) {
  return (
    <div className="relative border-t border-white/10">
      <Container>
        <dl className="grid grid-cols-2 divide-white/10 sm:grid-cols-4 sm:divide-x">
          {stats.map((item) => (
            <div key={item.key} className="py-6 sm:px-6 sm:first:pl-0">
              <dt className="text-xs font-medium text-noche-400">
                {item.label}
              </dt>
              <dd className="mt-1 font-display text-4xl leading-none font-bold tabular-nums">
                {formatNumber(item.value)}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </div>
  );
}

function JoinBanner() {
  return (
    <section className="relative overflow-hidden rounded-card bg-noche-950 px-6 py-12 text-white sm:px-12 sm:py-14">
      <CourtLines className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-1/2 text-white/[0.07] md:block" />
      <div className="relative max-w-xl">
        <h2 className="font-display text-4xl leading-none font-bold uppercase sm:text-5xl">
          Anotate en el <span className="text-oro-400">próximo torneo</span>
        </h2>
        <p className="mt-4 text-noche-300">
          Creá tu cuenta gratis, elegí el torneo y completá la inscripción con
          tu pareja en un minuto. El organizador te confirma el lugar.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/login?modo=registro">Crear cuenta</ButtonLink>
          <ButtonLink href="/torneos" variant="inverse">
            Ver torneos
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

/** El primero de cada categoría (la lista ya viene ordenada por puntos), de 1ra a 8va. */
function categoryLeaders(players: Player[]) {
  const leaders = new Map<string, Player>();
  for (const player of players) {
    if (!leaders.has(player.category)) leaders.set(player.category, player);
  }
  const order = (category: string) => {
    const index = (CATEGORIES as readonly string[]).indexOf(category);
    return index === -1 ? -1 : index;
  };
  return [...leaders.values()].toSorted(
    (a, b) => order(b.category) - order(a.category),
  );
}
