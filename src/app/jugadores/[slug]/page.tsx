import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getPlayer, getRankingPosition } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { genderLabel, playerName, sideLabel } from "@/lib/labels";

export async function generateMetadata({
  params,
}: PageProps<"/jugadores/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const player = await getPlayer(slug);
  return { title: player ? playerName(player) : "Jugador no encontrado" };
}

export default async function PlayerPage({
  params,
}: PageProps<"/jugadores/[slug]">) {
  const { slug } = await params;
  const player = await getPlayer(slug);
  if (!player) notFound();

  const position = await getRankingPosition(player);
  const name = playerName(player);
  const effectiveness =
    player.matches_played > 0
      ? Math.round((player.matches_won / player.matches_played) * 100)
      : 0;

  const stats = [
    {
      label: `Ranking ${genderLabel(player.gender).toLowerCase()}`,
      value: `#${position}`,
    },
    { label: "Puntos", value: formatNumber(player.ranking_points) },
    {
      label: "Partidos ganados",
      value: `${player.matches_won}/${player.matches_played}`,
    },
    { label: "Efectividad", value: `${effectiveness}%` },
    { label: "Títulos", value: String(player.titles) },
  ];

  return (
    <>
      <section className="bg-noche-950 text-white">
        <Container className="py-12 sm:py-16">
          <Link
            href={`/jugadores?rama=${player.gender}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-noche-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver al ranking
          </Link>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
            <Avatar
              name={name}
              src={player.photo_url}
              size="xl"
              className="ring-4 ring-oro-400"
            />
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="primary">{player.category}</Badge>
                <Badge tone="inverse">{genderLabel(player.gender)}</Badge>
                {player.side && (
                  <Badge tone="inverse">{sideLabel(player.side)}</Badge>
                )}
              </div>
              <h1 className="mt-3 font-display text-5xl leading-none font-bold uppercase sm:text-7xl">
                {name}
              </h1>
              <p className="mt-2 text-noche-300">
                {[player.club, player.city].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-5">
              <dt className="text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="mt-1 font-display text-4xl font-bold">
                {stat.value}
              </dd>
            </Card>
          ))}
        </dl>

        {player.bio && (
          <section className="mt-14 max-w-3xl">
            <h2 className="font-display text-3xl font-bold uppercase">
              Sobre {player.first_name}
            </h2>
            <p className="mt-4 text-lg leading-8 text-noche-700">
              {player.bio}
            </p>
          </section>
        )}
      </Container>
    </>
  );
}
