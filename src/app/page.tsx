import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Newspaper,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { CourtLines } from "@/components/court-lines";
import { EmptyState } from "@/components/empty-state";
import { NewsCard } from "@/components/news-card";
import { RankingList } from "@/components/ranking-list";
import { SectionHeading } from "@/components/section-heading";
import { TournamentCard } from "@/components/tournament-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getNews, getRanking, getStats, getTournaments } from "@/lib/data";
import { currentYear, formatDateRange, formatNumber } from "@/lib/format";
import { genderLabel, tournamentStatus } from "@/lib/labels";
import { siteConfig } from "@/lib/site";
import type { SiteStats } from "@/lib/data";
import type { Tournament } from "@/types/models";

export default async function Home() {
  const [tournaments, news, men, women, stats] = await Promise.all([
    getTournaments({ limit: 4 }),
    getNews({ limit: 3 }),
    getRanking({ gender: "masculino", limit: 5 }),
    getRanking({ gender: "femenino", limit: 5 }),
    getStats(),
  ]);

  const featuredTournament =
    tournaments.find((t) => t.status === "inscripciones") ?? tournaments[0];
  const [leadNews, ...moreNews] = news;
  const rankings = [
    { gender: "masculino", players: men },
    { gender: "femenino", players: women },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-noche-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_75%_0%,var(--color-noche-800)_0%,transparent_65%)]"
        />
        <CourtLines
          orientation="vertical"
          className="pointer-events-none absolute top-0 right-[-8%] hidden h-full w-[46%] text-white/[0.06] lg:block"
        />
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
            <FeaturedTournament tournament={featuredTournament} />
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
            <SectionHeading eyebrow="Top 5" title="Ranking" href="/jugadores" />
            <div className="mt-8 space-y-6">
              {rankings.map((ranking) => (
                <Card key={ranking.gender} className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h3 className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                      {genderLabel(ranking.gender)}
                    </h3>
                    <Link
                      href={`/jugadores?rama=${ranking.gender}`}
                      className="text-xs font-semibold text-accent transition-colors hover:text-accent-hover"
                    >
                      Ver completo
                    </Link>
                  </div>
                  <RankingList players={ranking.players} compact />
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

function FeaturedTournament({ tournament }: { tournament: Tournament }) {
  const status = tournamentStatus(tournament.status);

  return (
    <div className="relative rounded-card border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.25em] text-oro-400 uppercase">
          Próximo torneo
        </p>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      <h2 className="mt-5 font-display text-4xl leading-none font-bold uppercase sm:text-5xl">
        {tournament.name}
      </h2>
      <p className="mt-2 text-noche-300">
        {tournament.category} · {genderLabel(tournament.gender)}
      </p>
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
      <ButtonLink
        href={`/torneos/${tournament.slug}`}
        size="lg"
        className="mt-8 w-full"
      >
        {tournament.status === "inscripciones" ? "Inscribirme" : "Ver torneo"}
        <ArrowRight className="size-4" aria-hidden="true" />
      </ButtonLink>
    </div>
  );
}

function StatsStrip({ stats }: { stats: SiteStats }) {
  const items = [
    { value: stats.players, label: "Jugadores en el ranking" },
    { value: stats.tournamentsThisYear, label: `Torneos en ${currentYear()}` },
    { value: stats.venues, label: "Sedes" },
    { value: stats.cities, label: "Ciudades" },
  ];

  return (
    <div className="relative border-t border-white/10">
      <Container>
        <dl className="grid grid-cols-2 divide-white/10 sm:grid-cols-4 sm:divide-x">
          {items.map((item) => (
            <div key={item.label} className="py-6 sm:px-6 sm:first:pl-0">
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
