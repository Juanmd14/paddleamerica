import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RankingList } from "@/components/ranking-list";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getRanking } from "@/lib/data";
import { genderLabel } from "@/lib/labels";
import { cn, firstParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ranking",
};

const GENDERS = ["masculino", "femenino"] as const;

export default async function PlayersPage({
  searchParams,
}: PageProps<"/jugadores">) {
  const { rama } = await searchParams;
  const gender = firstParam(rama) === "femenino" ? "femenino" : "masculino";
  const players = await getRanking({ gender });

  return (
    <>
      <PageHeader
        eyebrow="Ranking regional"
        title="Jugadores"
        description="Ranking actualizado después de cada torneo del circuito."
      >
        <div className="inline-flex rounded-full bg-white/10 p-1">
          {GENDERS.map((option) => (
            <Link
              key={option}
              href={`/jugadores?rama=${option}`}
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
      </PageHeader>

      <Container className="py-12 sm:py-16">
        {players.length > 0 ? (
          <Card className="overflow-hidden">
            <RankingList players={players} />
          </Card>
        ) : (
          <EmptyState title="Todavía no hay jugadores en el ranking" />
        )}
      </Container>
    </>
  );
}
