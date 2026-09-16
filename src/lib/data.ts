import { cache } from "react";
import { getCurrentUser } from "@/lib/auth";
import { demoNews, demoPlayers, demoTournaments } from "@/lib/demo-data";
import { currentYear } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  NewsArticle,
  Notification,
  Player,
  Profile,
  RankingImport,
  Registration,
  RegistrationWithProfile,
  RegistrationWithTournament,
  Tournament,
} from "@/types/models";

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
  category,
  limit,
}: { gender?: string; category?: string; limit?: number } = {}): Promise<
  Player[]
> {
  if (isDemoMode) {
    return demoPlayers
      .filter((player) => !gender || player.gender === gender)
      .filter((player) => !category || player.category === category)
      .toSorted((a, b) => b.ranking_points - a.ranking_points)
      .slice(0, limit);
  }

  const supabase = await createClient();
  let query = supabase
    .from("players")
    .select("*")
    .order("ranking_points", { ascending: false });
  if (gender) query = query.eq("gender", gender);
  if (category) query = query.eq("category", category);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/** "1ra", "2da"... ordenadas por número; lo que no empieza con número va al final. */
function sortCategories(categories: Iterable<string>) {
  const rank = (value: string) => Number.parseInt(value, 10) || Infinity;
  return [...new Set(categories)].toSorted(
    (a, b) => rank(a) - rank(b) || a.localeCompare(b, "es"),
  );
}

/** Categorías que tienen jugadores en la rama, para los filtros del ranking. */
export async function getRankingCategories(gender: string): Promise<string[]> {
  if (isDemoMode) {
    return sortCategories(
      demoPlayers
        .filter((player) => player.gender === gender)
        .map((player) => player.category),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select("category")
    .eq("gender", gender);
  if (error) throw error;
  return sortCategories(data.map((row) => row.category));
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

  // RLS ya oculta borradores al público, pero un admin logueado los vería:
  // el sitio público filtra siempre.
  const supabase = await createClient();
  let query = supabase
    .from("news")
    .select("*")
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
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
      .eq("is_published", true)
      .lte("published_at", new Date().toISOString())
      .maybeSingle();
    if (error) throw error;
    return data;
  },
);

// ---------------------------------------------------------------------
// Números del circuito (franja del inicio)
// ---------------------------------------------------------------------

export type SiteStats = {
  players: number;
  tournamentsThisYear: number;
  venues: number;
  cities: number;
};

export async function getStats(): Promise<SiteStats> {
  let players: Pick<Player, "city">[];
  let tournaments: Pick<Tournament, "city" | "venue" | "starts_on">[];

  if (isDemoMode) {
    players = demoPlayers;
    tournaments = demoTournaments;
  } else {
    const supabase = await createClient();
    const [playersResult, tournamentsResult] = await Promise.all([
      supabase.from("players").select("city"),
      supabase.from("tournaments").select("city, venue, starts_on"),
    ]);
    if (playersResult.error) throw playersResult.error;
    if (tournamentsResult.error) throw tournamentsResult.error;
    players = playersResult.data;
    tournaments = tournamentsResult.data;
  }

  const year = String(currentYear());
  const distinct = (values: (string | null)[]) =>
    new Set(values.filter(Boolean)).size;

  return {
    players: players.length,
    tournamentsThisYear: tournaments.filter((t) => t.starts_on.startsWith(year))
      .length,
    venues: distinct(tournaments.map((t) => t.venue)),
    cities: distinct([
      ...players.map((p) => p.city),
      ...tournaments.map((t) => t.city),
    ]),
  };
}

// ---------------------------------------------------------------------
// Cuenta del usuario logueado (sin Supabase, no hay datos)
// ---------------------------------------------------------------------

export const getMyProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
});

export async function getMyRegistrations(): Promise<
  RegistrationWithTournament[]
> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_registrations")
    .select("*, tournament:tournaments(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getMyRegistration(
  tournamentId: number,
): Promise<Registration | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_registrations")
    .select("*")
    .eq("user_id", user.id)
    .eq("tournament_id", tournamentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMyNotifications(limit = 20): Promise<Notification[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getUnreadNotificationsCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

// ---------------------------------------------------------------------
// Admin (las páginas llaman antes a requireAdmin; RLS vuelve a chequear)
// ---------------------------------------------------------------------

export type TournamentWithCounts = Tournament & {
  registrations: number;
  pending: number;
};

/** Todos los torneos (próximos primero) con cantidad de inscriptos y pendientes. */
export async function getAllTournaments(): Promise<TournamentWithCounts[]> {
  if (isDemoMode) return [];

  const supabase = await createClient();
  const [tournaments, registrations] = await Promise.all([
    supabase
      .from("tournaments")
      .select("*")
      .order("starts_on", { ascending: false }),
    supabase.from("tournament_registrations").select("tournament_id, status"),
  ]);
  if (tournaments.error) throw tournaments.error;
  if (registrations.error) throw registrations.error;

  return tournaments.data.map((tournament) => {
    const own = registrations.data.filter(
      (registration) => registration.tournament_id === tournament.id,
    );
    return {
      ...tournament,
      registrations: own.length,
      pending: own.filter((registration) => registration.status === "pendiente")
        .length,
    };
  });
}

export async function getTournamentById(
  id: number,
): Promise<Tournament | null> {
  if (isDemoMode) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Todas las noticias, incluidas las no publicadas y programadas. */
export async function getAllNews(): Promise<NewsArticle[]> {
  if (isDemoMode) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getNewsById(id: number): Promise<NewsArticle | null> {
  if (isDemoMode) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPlayerById(id: number): Promise<Player | null> {
  if (isDemoMode) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Inscripciones de un torneo con nombre, email y teléfono del usuario. */
export async function getTournamentRegistrations(
  tournamentId: number,
): Promise<RegistrationWithProfile[]> {
  if (isDemoMode) return [];

  const supabase = await createClient();
  const { data: registrations, error } = await supabase
    .from("tournament_registrations")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (registrations.length === 0) return [];

  // user_id apunta a auth.users, así que el perfil se trae aparte.
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone")
    .in(
      "id",
      registrations.map((registration) => registration.user_id),
    );
  if (profilesError) throw profilesError;

  return registrations.map((registration) => ({
    ...registration,
    profile:
      profiles.find((profile) => profile.id === registration.user_id) ?? null,
  }));
}

export async function getLastPointsImport(): Promise<RankingImport | null> {
  if (isDemoMode) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ranking_imports")
    .select("*")
    .is("undone_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type AdminDashboard = {
  pendingRegistrations: number;
  upcoming: TournamentWithCounts[];
  counts: { tournaments: number; news: number; players: number };
  lastImport: RankingImport | null;
};

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const [tournaments, news, players, lastImport] = await Promise.all([
    getAllTournaments(),
    getAllNews(),
    getRanking(),
    getLastPointsImport(),
  ]);

  return {
    pendingRegistrations: tournaments.reduce(
      (total, tournament) => total + tournament.pending,
      0,
    ),
    upcoming: tournaments
      .filter((tournament) => tournament.status !== "finalizado")
      .toSorted((a, b) => a.starts_on.localeCompare(b.starts_on))
      .slice(0, 5),
    counts: {
      tournaments: tournaments.length,
      news: news.length,
      players: players.length,
    },
    lastImport,
  };
}
