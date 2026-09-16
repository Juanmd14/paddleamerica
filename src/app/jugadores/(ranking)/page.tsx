import { Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RankingList } from "@/components/ranking-list";
import { RankingCourt } from "@/components/ranking-court";
import { RankingTable } from "@/components/ranking-table";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getRanking, getRankingCategories } from "@/lib/data";
import { genderLabel } from "@/lib/labels";
import { cn, firstParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ranking",
  description:
    "Ranking regional de pádel masculino y femenino, por categoría, actualizado después de cada torneo.",
};

const GENDERS = ["masculino", "femenino"] as const;

function rankingHref(gender: string, category?: string) {
  const params = new URLSearchParams({ rama: gender });
  if (category) params.set("categoria", category);
  return `/jugadores?${params}`;
}

export default async function PlayersPage({
  searchParams,
}: PageProps<"/jugadores">) {
  const { rama, categoria } = await searchParams;
  const gender = firstParam(rama) === "femenino" ? "femenino" : "masculino";

  const categories = await getRankingCategories(gender);
  const requested = firstParam(categoria);
  const category =
    requested && categories.includes(requested) ? requested : undefined;
  const players = await getRanking({ gender, category });

  const title = category
    ? `${genderLabel(gender)} · ${category}`
    : `${genderLabel(gender)} · General`;

  return (
    <>
      <PageHeader
        eyebrow="Ranking regional"
        title="Ranking"
        decoration={false}
        description="Puntos acumulados en los torneos del circuito. Se actualiza después de cada fecha."
      >
        <div className="inline-flex rounded-full bg-white/10 p-1">
          {GENDERS.map((option) => (
            <Link
              key={option}
              href={rankingHref(option)}
              aria-current={option === gender ? "page" : undefined}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-semibold transition-colors",
                option === gender
                  ? "bg-primary text-primary-foreground"
                  : "text-noche-300 hover:text-white",
              )}
            >
              {genderLabel(option)}
            </Link>
          ))}
        </div>
        {categories.length > 1 && (
          <nav
            aria-label="Categorías"
            className="-mx-4 mt-4 scrollbar-none flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
          >
            {[undefined, ...categories].map((option) => {
              const active = option === category;
              return (
                <Link
                  key={option ?? "todas"}
                  href={rankingHref(gender, option)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
                    active
                      ? "border-white bg-white text-noche-950"
                      : "border-white/15 text-noche-300 hover:border-white/40 hover:text-white",
                  )}
                >
                  {option ?? "Todas"}
                </Link>
              );
            })}
          </nav>
        )}
      </PageHeader>

      {players.length > 0 && (
        <section
          aria-label="Top 4"
          className="border-t border-white/5 bg-noche-950 pb-14 sm:pb-20"
        >
          <Container className="pt-10 sm:pt-14">
            <RankingCourt players={players} />
          </Container>
        </section>
      )}

      <Container className="py-10 sm:py-14">
        {players.length > 0 ? (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-2xl font-bold uppercase sm:text-3xl">
                {title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {players.length}{" "}
                {players.length === 1 ? "jugador" : "jugadores"}
              </p>
            </div>

            <Card className="mt-4 overflow-hidden">
              <RankingList players={players} className="md:hidden" />
              <div className="hidden md:block">
                <RankingTable players={players} />
              </div>
            </Card>
          </>
        ) : (
          <div>
            <EmptyState
              icon={Users}
              title="Todavía no hay jugadores en este ranking"
              description="Los puntos se cargan después de cada torneo del circuito."
              action={
                category && (
                  <ButtonLink href={rankingHref(gender)} variant="outline">
                    Ver todas las categorías
                  </ButtonLink>
                )
              }
            />
          </div>
        )}
      </Container>
    </>
  );
}
