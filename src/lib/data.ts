import { cache } from "react";
import { getCurrentUser, safeAvatarUrl } from "@/lib/auth";
import {
  demoNews,
  demoPlayers,
  demoSpots,
  demoTournaments,
} from "@/lib/demo-data";
import { currentPeriod } from "@/lib/format";
import {
  comparePlayers,
  DEFAULT_STATS,
  STAT_KEYS,
  type StatKey,
  type StatSetting,
  statLabel,
} from "@/lib/labels";
import {
  GAIN_DAYS,
  type RankingTrend,
  rankingTrends,
} from "@/lib/ranking-trends";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminProfile,
  NewsArticle,
  Notification,
  Player,
  PlayerPointChange,
  Profile,
  PublicProfile,
  RankingImport,
  Registration,
  RegistrationWithPeople,
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
  includeInactive = false,
}: {
  gender?: string;
  /** "1ra", "5ta"... El ranking del circuito es por categoría y rama. */
  category?: string;
  limit?: number;
  /** Solo el panel: también los que ya no compiten. */
  includeInactive?: boolean;
} = {}): Promise<Player[]> {
  if (isDemoMode) {
    return demoPlayers
      .filter((player) => includeInactive || player.active)
      .filter((player) => !gender || player.gender === gender)
      .filter((player) => !category || player.category === category)
      .toSorted(comparePlayers)
      .slice(0, limit);
  }

  const supabase = await createClient();
  let query = supabase
    .from("players")
    .select("*")
    // Apellido y nombre desempatan: recién cargado el padrón están todos en 0
    // y sin esto Postgres devuelve un orden distinto en cada visita.
    .order("ranking_points", { ascending: false })
    .order("last_name")
    .order("first_name");
  if (!includeInactive) query = query.eq("active", true);
  if (gender) query = query.eq("gender", gender);
  if (category) query = query.eq("category", category);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/** Cambios de puntos del último mes (uno por request, lo usan las dos ramas del inicio). */
const getRecentPointChanges = cache(async () => {
  const since = new Date(
    Date.now() - GAIN_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_point_changes")
    .select("player_id, delta, created_at")
    .gte("created_at", since);
  if (error) throw error;
  return data;
});

/**
 * Puntos ganados en el último mes y puestos subidos en la semana, calculados
 * sobre la lista completa que se muestra (rama o categoría).
 */
export async function getRankingTrends(
  players: Player[],
): Promise<Map<number, RankingTrend>> {
  if (isDemoMode || players.length === 0) return new Map();
  return rankingTrends(players, await getRecentPointChanges());
}

/**
 * Cuándo cambió el ranking por última vez: el último movimiento de puntos o,
 * si nunca hubo, el último jugador cargado. Null si no hay jugadores.
 */
export const getRankingUpdatedAt = cache(async (): Promise<string | null> => {
  if (isDemoMode) {
    return (
      demoPlayers
        .map((player) => player.created_at)
        .toSorted()
        .at(-1) ?? null
    );
  }

  const supabase = await createClient();
  const [changes, players] = await Promise.all([
    supabase
      .from("player_point_changes")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("players")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (changes.error) throw changes.error;
  if (players.error) throw players.error;
  return (
    [changes.data?.created_at, players.data?.created_at]
      .filter((value): value is string => Boolean(value))
      .toSorted()
      .at(-1) ?? null
  );
});

/** Historial de puntos de un jugador, lo más nuevo primero. */
export async function getPlayerPointChanges(
  playerId: number,
  limit = 20,
): Promise<PlayerPointChange[]> {
  if (isDemoMode) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_point_changes")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(limit);
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

/** Cuántos jugadores hay en cada categoría de una rama. */
export async function getCategoryCounts(
  gender: string,
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  if (isDemoMode) {
    for (const player of demoPlayers) {
      if (player.gender !== gender || !player.active) continue;
      counts[player.category] = (counts[player.category] ?? 0) + 1;
    }
    return counts;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select("category")
    .eq("gender", gender)
    .eq("active", true);
  if (error) throw error;

  for (const { category } of data) {
    counts[category] = (counts[category] ?? 0) + 1;
  }
  return counts;
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

/**
 * Posición del jugador en el ranking de su rama y categoría (1 = primero),
 * igual que en /jugadores. Null si ya no compite.
 */
export async function getRankingPosition(
  player: Player,
): Promise<number | null> {
  if (!player.active) return null;
  if (isDemoMode) {
    const ahead = demoPlayers.filter(
      (other) =>
        other.active &&
        other.gender === player.gender &&
        other.category === player.category &&
        other.ranking_points > player.ranking_points,
    );
    return ahead.length + 1;
  }

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("active", true)
    .eq("gender", player.gender)
    .eq("category", player.category)
    .gt("ranking_points", player.ranking_points);
  if (error) throw error;
  return (count ?? 0) + 1;
}

// ---------------------------------------------------------------------
// Torneos
// ---------------------------------------------------------------------

/** Orden de los próximos: primero los que tienen la inscripción abierta, después los que se están jugando y al final los que vienen. */
const UPCOMING_ORDER: Record<string, number> = {
  inscripciones: 0,
  en_juego: 1,
  proximo: 2,
};

function sortUpcoming(tournaments: Tournament[]) {
  return tournaments.toSorted(
    (a, b) =>
      (UPCOMING_ORDER[a.status] ?? 3) - (UPCOMING_ORDER[b.status] ?? 3) ||
      a.starts_on.localeCompare(b.starts_on),
  );
}

/** Próximos (abiertos primero, después por fecha) o finalizados (más recientes primero). */
export async function getTournaments({
  finished = false,
  limit,
}: { finished?: boolean; limit?: number } = {}): Promise<Tournament[]> {
  if (isDemoMode) {
    const matching = demoTournaments.filter(
      (tournament) => (tournament.status === "finalizado") === finished,
    );
    return (
      finished
        ? matching.toSorted((a, b) => b.starts_on.localeCompare(a.starts_on))
        : sortUpcoming(matching)
    ).slice(0, limit);
  }

  const supabase = await createClient();
  let query = supabase
    .from("tournaments")
    .select("*")
    .order("starts_on", { ascending: !finished });
  query = finished
    ? query.eq("status", "finalizado")
    : query.neq("status", "finalizado");
  // Los próximos se ordenan por estado acá, así que el límite va después.
  if (limit && finished) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return finished ? data : sortUpcoming(data).slice(0, limit);
}

/** El torneo grande del inicio: el destacado más cercano o, si no hay, el primero de los próximos (ya ordenados). */
export function pickFeaturedTournament(
  upcoming: Tournament[],
): Tournament | null {
  return (
    upcoming
      .filter((tournament) => tournament.featured)
      .toSorted((a, b) => a.starts_on.localeCompare(b.starts_on))[0] ??
    upcoming[0] ??
    null
  );
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
// Cupos de torneos
// ---------------------------------------------------------------------

/** Parejas anotadas (pendientes + confirmadas) por torneo. */
export const getTournamentSpots = cache(
  async (): Promise<Map<number, number>> => {
    if (isDemoMode) {
      return new Map(
        Object.entries(demoSpots).map(([id, taken]) => [Number(id), taken]),
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("tournament_spots");
    if (error) throw error;
    return new Map(data.map((row) => [row.tournament_id, row.taken]));
  },
);

// ---------------------------------------------------------------------
// Configuración del sitio y números del inicio
// ---------------------------------------------------------------------

export type SiteSettings = {
  heroImageUrl: string | null;
  stats: StatSetting[];
};

function parseStatSettings(value: unknown): StatSetting[] {
  if (!Array.isArray(value)) return DEFAULT_STATS;
  const parsed = value
    .filter(
      (item): item is StatSetting =>
        typeof item === "object" &&
        item !== null &&
        STAT_KEYS.includes((item as StatSetting).key),
    )
    .map((item) => ({
      key: item.key,
      label: typeof item.label === "string" && item.label ? item.label : null,
      value:
        typeof item.value === "number" && Number.isInteger(item.value)
          ? item.value
          : null,
    }))
    .slice(0, 4);
  return parsed.length > 0 ? parsed : DEFAULT_STATS;
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (isDemoMode) return { heroImageUrl: null, stats: DEFAULT_STATS };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("hero_image_url, stats")
    .maybeSingle();
  if (error) throw error;
  return {
    heroImageUrl: data?.hero_image_url ?? null,
    stats: parseStatSettings(data?.stats),
  };
});

/** Valor automático de cada número del inicio. */
export async function getStats(): Promise<Record<StatKey, number>> {
  let players: Pick<Player, "city" | "club">[];
  let tournaments: Pick<Tournament, "id" | "city" | "venue" | "starts_on">[];

  if (isDemoMode) {
    players = demoPlayers.filter((player) => player.active);
    tournaments = demoTournaments;
  } else {
    const supabase = await createClient();
    const [playersResult, tournamentsResult] = await Promise.all([
      supabase.from("players").select("city, club").eq("active", true),
      supabase.from("tournaments").select("id, city, venue, starts_on"),
    ]);
    if (playersResult.error) throw playersResult.error;
    if (tournamentsResult.error) throw tournamentsResult.error;
    players = playersResult.data;
    tournaments = tournamentsResult.data;
  }

  const { year, yearMonth } = currentPeriod();
  const spots = await getTournamentSpots();
  const distinct = (values: (string | null)[]) =>
    new Set(values.filter(Boolean)).size;
  const thisYear = tournaments.filter((t) => t.starts_on.startsWith(year));

  return {
    players: players.length,
    tournaments_year: thisYear.length,
    tournaments_month: tournaments.filter((t) =>
      t.starts_on.startsWith(yearMonth),
    ).length,
    venues: distinct(tournaments.map((t) => t.venue)),
    cities: distinct([
      ...players.map((p) => p.city),
      ...tournaments.map((t) => t.city),
    ]),
    clubs: distinct(players.map((p) => p.club)),
    registrations_year: thisYear.reduce(
      (total, tournament) => total + (spots.get(tournament.id) ?? 0),
      0,
    ),
  };
}

export type HomeStat = { key: StatKey; label: string; value: number };

/** Los números del inicio: automáticos, con título y valor corregibles desde el panel. */
export async function getHomeStats(): Promise<HomeStat[]> {
  const [settings, values] = await Promise.all([getSiteSettings(), getStats()]);
  const period = currentPeriod();
  return settings.stats.map((stat) => ({
    key: stat.key,
    label: stat.label || statLabel(stat.key, period),
    value: stat.value ?? values[stat.key],
  }));
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

/** Nombre, usuario, foto y categoría de otros usuarios (sin email ni teléfono). */
async function getPublicProfiles(
  ids: (string | null)[],
): Promise<Map<string, PublicProfile>> {
  const unique = [...new Set(ids.filter((id) => id !== null))];
  if (unique.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_profiles", {
    p_ids: unique,
  });
  if (error) throw error;
  return new Map(
    data.map((profile) => [
      profile.id,
      { ...profile, avatar_url: safeAvatarUrl(profile.avatar_url) },
    ]),
  );
}

async function withPeople<T extends Registration>(
  registrations: T[],
): Promise<(T & Pick<RegistrationWithPeople, "player" | "partner">)[]> {
  const profiles = await getPublicProfiles(
    registrations.flatMap((registration) => [
      registration.user_id,
      registration.partner_id,
    ]),
  );
  return registrations.map((registration) => ({
    ...registration,
    player: profiles.get(registration.user_id) ?? null,
    partner: registration.partner_id
      ? (profiles.get(registration.partner_id) ?? null)
      : null,
  }));
}

/** Inscripciones donde el usuario se anotó o es la pareja (con invitaciones). */
export async function getMyRegistrations(): Promise<
  RegistrationWithTournament[]
> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_registrations")
    .select("*, tournament:tournaments(*)")
    .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return withPeople(data);
}

export type MyTournamentEntry = {
  /** La inscripción propia (anotado, invitando, o pareja que ya aceptó). */
  registration: RegistrationWithPeople | null;
  /** Invitaciones de otros jugadores que falta responder. */
  invitations: RegistrationWithPeople[];
};

export async function getMyTournamentEntry(
  tournamentId: number,
): Promise<MyTournamentEntry> {
  const user = await getCurrentUser();
  if (!user) return { registration: null, invitations: [] };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_registrations")
    .select("*")
    .eq("tournament_id", tournamentId)
    .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = await withPeople(data);
  const isInvitation = (row: Registration) =>
    row.partner_id === user.id && row.status === "invitacion";
  return {
    registration:
      rows.find(
        (row) =>
          !isInvitation(row) &&
          (row.user_id === user.id ||
            row.status === "pendiente" ||
            row.status === "confirmada"),
      ) ?? null,
    invitations: rows.filter(isInvitation),
  };
}

/** Invitaciones a jugar que el usuario todavía no respondió. */
export async function getMyInvitations(): Promise<
  RegistrationWithTournament[]
> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_registrations")
    .select("*, tournament:tournaments(*)")
    .eq("partner_id", user.id)
    .eq("status", "invitacion")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return withPeople(data);
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

/** Número de la campana: avisos sin leer o, si ya se leyeron, invitaciones sin responder. */
export async function getUnreadNotificationsCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;

  const supabase = await createClient();
  const [unread, invitations] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
    // Solo las invitaciones que todavía se pueden responder.
    supabase
      .from("tournament_registrations")
      .select("id, tournament:tournaments!inner(status)", {
        count: "exact",
        head: true,
      })
      .eq("partner_id", user.id)
      .eq("status", "invitacion")
      .eq("tournament.status", "inscripciones"),
  ]);
  // El número de la campanita está en el header de todo el sitio: si falla la
  // consulta, no vale tirar abajo la página entera.
  if (unread.error) console.error("[avisos sin leer]", unread.error);
  if (invitations.error) console.error("[invitaciones]", invitations.error);
  return Math.max(unread.count ?? 0, invitations.count ?? 0);
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

/** Inscripciones de un torneo con los perfiles de los dos jugadores (email y teléfono incluidos). */
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
  return withAdminProfiles(registrations);
}

/** Inscripciones para confirmar de todos los torneos, las más viejas primero. */
export async function getPendingRegistrations(): Promise<
  (RegistrationWithProfile & { tournament: Tournament })[]
> {
  if (isDemoMode) return [];

  const supabase = await createClient();
  const { data: registrations, error } = await supabase
    .from("tournament_registrations")
    .select("*, tournament:tournaments(*)")
    .eq("status", "pendiente")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return withAdminProfiles(registrations);
}

/** Ficha de una cuenta para el panel. */
export async function getProfileById(id: string): Promise<Profile | null> {
  if (isDemoMode) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? { ...data, avatar_url: safeAvatarUrl(data.avatar_url) } : null;
}

/** Inscripciones de una cuenta (como quien se anotó o como pareja), las más nuevas primero. */
export async function getUserRegistrations(
  userId: string,
): Promise<(RegistrationWithProfile & { tournament: Tournament })[]> {
  if (isDemoMode) return [];

  const supabase = await createClient();
  const { data: registrations, error } = await supabase
    .from("tournament_registrations")
    .select("*, tournament:tournaments(*)")
    .or(`user_id.eq.${userId},partner_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return withAdminProfiles(registrations);
}

/** Suma a cada inscripción los perfiles completos de los dos jugadores (solo panel). */
async function withAdminProfiles<T extends Registration>(
  registrations: T[],
): Promise<(T & Omit<RegistrationWithProfile, keyof Registration>)[]> {
  if (registrations.length === 0) return [];
  const supabase = await createClient();

  // user_id y partner_id apuntan a auth.users, así que los perfiles se traen aparte.
  const ids = [
    ...new Set(
      registrations.flatMap((registration) =>
        registration.partner_id
          ? [registration.user_id, registration.partner_id]
          : [registration.user_id],
      ),
    ),
  ];
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, username, avatar_url, category, gender",
    )
    .in("id", ids);
  if (profilesError) throw profilesError;

  const byId = new Map(
    profiles.map((profile) => [
      profile.id,
      { ...profile, avatar_url: safeAvatarUrl(profile.avatar_url) },
    ]),
  );
  return registrations.map((registration) => ({
    ...registration,
    profile: byId.get(registration.user_id) ?? null,
    partnerProfile: registration.partner_id
      ? (byId.get(registration.partner_id) ?? null)
      : null,
  }));
}

/** Cuentas vinculadas a un jugador del ranking, por id de jugador (panel). */
export async function getLinkedAccounts(): Promise<
  Map<number, Pick<Profile, "id" | "full_name" | "username" | "avatar_url">>
> {
  if (isDemoMode) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, player_id")
    .not("player_id", "is", null);
  if (error) throw error;
  return new Map(
    data.map(({ player_id, ...profile }) => [
      player_id as number,
      { ...profile, avatar_url: safeAvatarUrl(profile.avatar_url) },
    ]),
  );
}

/** Foto de la cuenta vinculada, para jugadores del ranking sin foto propia. */
export async function getPlayerAccountAvatar(
  playerId: number,
): Promise<string | null> {
  if (isDemoMode) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_player_account_avatar", {
    p_player_id: playerId,
  });
  if (error) {
    console.error("[foto del jugador]", error);
    return null;
  }
  return safeAvatarUrl(data);
}

/** Puesto, puntos y tendencia del jugador vinculado a la cuenta (o null). */
export async function getMyRankingSpot(): Promise<{
  player: Player;
  position: number | null;
  trend?: RankingTrend;
} | null> {
  const profile = await getMyProfile();
  if (!profile?.player_id) return null;

  const player = await getPlayerById(profile.player_id);
  if (!player) return null;

  const [position, list] = await Promise.all([
    getRankingPosition(player),
    player.active
      ? getRanking({ gender: player.gender, category: player.category })
      : Promise.resolve([]),
  ]);
  const trends = await getRankingTrends(list);
  return { player, position, trend: trends.get(player.id) };
}

/** Todas las cuentas, para asignar categorías. Primero las que no tienen. */
export async function getAllProfiles(): Promise<
  (AdminProfile & Pick<Profile, "is_admin" | "player_id">)[]
> {
  if (isDemoMode) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, username, avatar_url, category, gender, is_admin, player_id",
    )
    .order("category", { ascending: true, nullsFirst: true })
    .order("full_name", { ascending: true });
  if (error) throw error;
  return data.map((profile) => ({
    ...profile,
    avatar_url: safeAvatarUrl(profile.avatar_url),
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

/** Cuentas que esperan que un admin les asigne la categoría. */
export async function countAccountsWithoutCategory(): Promise<number> {
  if (isDemoMode) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .is("category", null);
  if (error) throw error;
  return count ?? 0;
}

export type AdminDashboard = {
  pendingRegistrations: number;
  accountsWithoutCategory: number;
  upcoming: TournamentWithCounts[];
  counts: { tournaments: number; news: number; players: number };
  lastImport: RankingImport | null;
};

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const [tournaments, news, players, lastImport, accountsWithoutCategory] =
    await Promise.all([
      getAllTournaments(),
      getAllNews(),
      getRanking({ includeInactive: true }),
      getLastPointsImport(),
      countAccountsWithoutCategory(),
    ]);

  return {
    pendingRegistrations: tournaments.reduce(
      (total, tournament) => total + tournament.pending,
      0,
    ),
    accountsWithoutCategory,
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
