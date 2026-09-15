import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
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
import { getNews, getRanking, getTournaments } from "@/lib/data";
import { formatDateRange } from "@/lib/format";
import { tournamentStatus } from "@/lib/labels";
import { siteConfig } from "@/lib/site";
import type { Tournament } from "@/types/models";

export default async function Home() {
  const [tournaments, news, men, women] = await Promise.all([
    getTournaments({ limit: 3 }),
    getNews({ limit: 3 }),
    getRanking({ gender: "masculino", limit: 5 }),
    getRanking({ gender: "femenino", limit: 5 }),
  ]);

  const [featuredTournament] = tournaments;
  const [leadNews, ...moreNews] = news;
  const rankings = [
    { gender: "masculino", label: "Masculino", players: men },
    { gender: "femenino", label: "Femenino", players: women },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-noche-950 text-white">
        <CourtLines className="pointer-events-none absolute top-1/2 -right-48 hidden h-[130%] -translate-y-1/2 text-white/[0.07] lg:block" />
        <Container className="relative grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.25fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-oro-400 uppercase">
              Circuito regional · {siteConfig.region}
            </p>
            <h1 className="mt-5 font-display text-6xl leading-[0.9] font-bold uppercase sm:text-7xl lg:text-8xl">
              Todo el pádel <span className="text-oro-400">de la zona</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-noche-300">
              Torneos, ranking y noticias del circuito. Seguí a los mejores
              jugadores y anotate en el próximo torneo.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/torneos" size="lg">
                Ver torneos
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
      </section>

      <Container className="space-y-20 py-16 sm:py-20">
        <section>
          <SectionHeading title="Próximos torneos" href="/torneos" />
          {tournaments.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState title="No hay torneos programados" />
            </div>
          )}
        </section>

        <div className="grid gap-16 lg:grid-cols-3 lg:gap-12">
          <section className="lg:col-span-2">
            <SectionHeading title="Últimas noticias" href="/noticias" />
            {leadNews ? (
              <>
                <div className="mt-8">
                  <NewsCard article={leadNews} featured />
                </div>
                {moreNews.length > 0 && (
                  <div className="mt-10 grid gap-10 sm:grid-cols-2">
                    {moreNews.map((article) => (
                      <NewsCard key={article.id} article={article} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="mt-8">
                <EmptyState title="Todavía no hay noticias" />
              </div>
            )}
          </section>

          <aside>
            <SectionHeading title="Ranking" href="/jugadores" />
            <div className="mt-8 space-y-6">
              {rankings.map((ranking) => (
                <Card key={ranking.gender} className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h3 className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                      {ranking.label}
                    </h3>
                    <Link
                      href={`/jugadores?rama=${ranking.gender}`}
                      className="text-xs font-semibold text-accent hover:text-pista-800"
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
      </Container>
    </>
  );
}

function FeaturedTournament({ tournament }: { tournament: Tournament }) {
  const status = tournamentStatus(tournament.status);

  return (
    <div className="rounded-card border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.25em] text-oro-400 uppercase">
          Próximo torneo
        </p>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      <h2 className="mt-5 font-display text-4xl leading-none font-bold uppercase sm:text-5xl">
        {tournament.name}
      </h2>
      <p className="mt-2 text-noche-300">{tournament.category}</p>
      <ul className="mt-6 space-y-3 text-noche-200">
        <li className="flex items-center gap-3">
          <CalendarDays className="size-5 text-oro-400" aria-hidden="true" />
          {formatDateRange(tournament.starts_on, tournament.ends_on)}
        </li>
        <li className="flex items-center gap-3">
          <MapPin className="size-5 text-oro-400" aria-hidden="true" />
          {[tournament.venue, tournament.city].filter(Boolean).join(", ")}
        </li>
      </ul>
      <ButtonLink
        href={`/torneos/${tournament.slug}`}
        size="lg"
        className="mt-8 w-full"
      >
        Ver torneo
        <ArrowRight className="size-4" aria-hidden="true" />
      </ButtonLink>
    </div>
  );
}
