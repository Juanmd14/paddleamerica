import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareButton } from "@/components/share-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  getPlayer,
  getPlayerAccountAvatar,
  getRankingPosition,
} from "@/lib/data";
import { formatNumber } from "@/lib/format";
import {
  effectiveness,
  genderLabel,
  playerName,
  rankingTitle,
  sideLabel,
} from "@/lib/labels";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/jugadores/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const player = await getPlayer(slug);
  if (!player) return { title: "Jugador no encontrado" };

  return {
    title: playerName(player),
    description: `${player.category} ${genderLabel(player.gender).toLowerCase()} · ${formatNumber(player.ranking_points)} puntos en el ranking regional.${player.club ? ` Juega en ${player.club}.` : ""}`,
  };
}

export default async function PlayerPage({
  params,
}: PageProps<"/jugadores/[slug]">) {
  const { slug } = await params;
  const player = await getPlayer(slug);
  if (!player) notFound();

  const [position, accountAvatar] = await Promise.all([
    getRankingPosition(player),
    // Sin foto cargada en el ranking, usa la de su cuenta (si está vinculada).
    player.photo_url
      ? Promise.resolve(null)
      : getPlayerAccountAvatar(player.id),
  ]);
  const name = playerName(player);
  const winRate = effectiveness(player);

  const stats = [
    { label: "Puntos", value: formatNumber(player.ranking_points) },
    {
      label: "Partidos ganados",
      value: `${player.matches_won}/${player.matches_played}`,
    },
    { label: "Títulos", value: String(player.titles) },
  ];

  return (
    <>
      <section className="bg-noche-950 text-white">
        <Container className="py-12 sm:py-16">
          <Link
            href={`/jugadores?${new URLSearchParams({ rama: player.gender, categoria: player.category })}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-noche-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver al ranking
          </Link>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
            <Avatar
              name={name}
              src={player.photo_url ?? accountAvatar}
              size="xl"
              className="ring-4 ring-oro-400"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                <Badge tone="primary">{player.category}</Badge>
                <Badge tone="inverse">{genderLabel(player.gender)}</Badge>
                {player.side && (
                  <Badge tone="inverse">{sideLabel(player.side)}</Badge>
                )}
                {!player.active && <Badge tone="inverse">Ya no compite</Badge>}
              </div>
              <h1 className="mt-3 font-display text-5xl leading-none font-bold uppercase sm:text-7xl">
                {name}
              </h1>
              <p className="mt-2 text-noche-300">
                {[player.club, player.city].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="sm:text-right">
              {position ? (
                <>
                  <p className="text-xs font-semibold tracking-[0.2em] text-noche-400 uppercase">
                    Ranking {rankingTitle(player.category, player.gender)}
                  </p>
                  <p className="font-display text-7xl leading-none font-bold text-oro-400 tabular-nums">
                    #{position}
                  </p>
                </>
              ) : (
                <p className="text-xs font-semibold tracking-[0.2em] text-noche-400 uppercase">
                  Ya no compite en el circuito
                </p>
              )}
              <ShareButton
                title={`${name} · Ranking regional`}
                text={
                  position
                    ? `${name}: #${position} del ranking ${rankingTitle(player.category, player.gender)}`
                    : `${name} en el ranking regional`
                }
                variant="inverse"
                className="mt-4"
              />
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <Card className="overflow-hidden">
          <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-surface p-5 sm:p-6">
                <dt className="text-sm text-muted-foreground">{stat.label}</dt>
                <dd className="mt-1 font-display text-4xl leading-none font-bold tabular-nums">
                  {stat.value}
                </dd>
              </div>
            ))}
            <div className="bg-surface p-5 sm:p-6">
              <dt className="text-sm text-muted-foreground">Efectividad</dt>
              <dd className="mt-1">
                <span className="block font-display text-4xl leading-none font-bold tabular-nums">
                  {winRate}%
                </span>
                <span
                  className="mt-3 block h-1.5 overflow-hidden rounded-full bg-muted"
                  aria-hidden="true"
                >
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      winRate >= 60 ? "bg-oro-400" : "bg-pista-500",
                    )}
                    style={{ width: `${winRate}%` }}
                  />
                </span>
              </dd>
            </div>
          </dl>
        </Card>

        {player.bio && (
          <section className="mt-14 max-w-3xl">
            <h2 className="font-display text-3xl font-bold uppercase">
              Sobre {player.first_name}
            </h2>
            <p className="mt-4 text-lg leading-8 text-foreground-soft">
              {player.bio}
            </p>
          </section>
        )}
      </Container>
    </>
  );
}
