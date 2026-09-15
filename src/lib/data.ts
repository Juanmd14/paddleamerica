import { cache } from "react";
import { demoNews, demoPlayers, demoTournaments } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { NewsArticle, Player, Tournament } from "@/types/models";

/*
 * Toda la lectura de datos del sitio pasa por acá.
 * Sin Supabase configurado se usan los datos de ejemplo de demo-data.ts,
 * así el sitio se puede diseñar y mostrar sin backend.
 */
export const isDemoMode = !isSupabaseConfigured;

// ---------------------------------------------------------------------
// Jugadores
// ---------------------------------------------------------------------

export async function getRanking({
  gender,
  limit,
}: { gender?: string; limit?: number } = {}): Promise<Player[]> {
  if (isDemoMode) {
    return demoPlayers
      .filter((player) => !gender || player.gender === gender)
      .toSorted((a, b) => b.ranking_points - a.ranking_points)
      .slice(0, limit);
  }

  const supabase = await createClient();
  let query = supabase
    .from("players")
    .select("*")
    .order("ranking_points", { ascending: false });
  if (gender) query = query.eq("gender", gender);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export const getPlayer = cache(async (slug: string): Promise<Player | null> => {
  if (isDemoMode) {
    return demoPlayers.find((player) => player.slug === slug) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
});

/** Posición del jugador en el ranking de su rama (1 = primero). */
export async function getRankingPosition(player: Player): Promise<number> {
  if (isDemoMode) {
    const ahead = demoPlayers.filter(
      (other) =>
        other.gender === player.gender &&
        other.ranking_points > player.ranking_points,
    );
    return ahead.length + 1;
  }

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("gender", player.gender)
    .gt("ranking_points", player.ranking_points);
  if (error) throw error;
  return (count ?? 0) + 1;
}

// ---------------------------------------------------------------------
// Torneos
// ---------------------------------------------------------------------

/** Próximos (por fecha ascendente) o finalizados (más recientes primero). */
export async function getTournaments({
  finished = false,
  limit,
}: { finished?: boolean; limit?: number } = {}): Promise<Tournament[]> {
  if (isDemoMode) {
    return demoTournaments
      .filter((tournament) => (tournament.status === "finalizado") === finished)
      .toSorted((a, b) =>
        finished
          ? b.starts_on.localeCompare(a.starts_on)
          : a.starts_on.localeCompare(b.starts_on),
      )
      .slice(0, limit);
  }

  const supabase = await createClient();
  let query = supabase
    .from("tournaments")
    .select("*")
    .order("starts_on", { ascending: !finished });
  query = finished
    ? query.eq("status", "finalizado")
    : query.neq("status", "finalizado");
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export const getTournament = cache(
  async (slug: string): Promise<Tournament | null> => {
    if (isDemoMode) {
      return demoTournaments.find((t) => t.slug === slug) ?? null;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
);

// ---------------------------------------------------------------------
// Noticias
// ---------------------------------------------------------------------

export async function getNews({ limit }: { limit?: number } = {}): Promise<
  NewsArticle[]
> {
  if (isDemoMode) {
    return demoNews
      .filter((article) => article.is_published)
      .toSorted((a, b) => b.published_at.localeCompare(a.published_at))
      .slice(0, limit);
  }

  const supabase = await createClient();
  let query = supabase
    .from("news")
    .select("*")
    .order("published_at", { ascending: false });
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export const getNewsArticle = cache(
  async (slug: string): Promise<NewsArticle | null> => {
    if (isDemoMode) {
      return demoNews.find((article) => article.slug === slug) ?? null;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
);
