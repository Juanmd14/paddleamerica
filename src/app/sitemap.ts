import type { MetadataRoute } from "next";
import { getClubs, getNews, getRanking, getTournaments } from "@/lib/data";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [upcoming, finished, players, news, clubs] = await Promise.all([
    getTournaments(),
    getTournaments({ finished: true }),
    getRanking(),
    getNews(),
    getClubs(),
  ]);

  const url = (path: string) => `${siteConfig.url}${path}`;

  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/torneos"), changeFrequency: "daily", priority: 0.9 },
    { url: url("/jugadores"), changeFrequency: "weekly", priority: 0.8 },
    { url: url("/noticias"), changeFrequency: "daily", priority: 0.8 },
    { url: url("/clubes"), changeFrequency: "weekly", priority: 0.7 },
    ...[...upcoming, ...finished].map((tournament) => ({
      url: url(`/torneos/${tournament.slug}`),
      lastModified: tournament.created_at,
      priority: tournament.status === "finalizado" ? 0.5 : 0.8,
    })),
    ...clubs.map((club) => ({
      url: url(`/clubes/${club.slug}`),
      priority: 0.6,
    })),
    ...players.map((player) => ({
      url: url(`/jugadores/${player.slug}`),
      priority: 0.6,
    })),
    ...news.map((article) => ({
      url: url(`/noticias/${article.slug}`),
      lastModified: article.published_at,
      priority: 0.7,
    })),
  ];
}
