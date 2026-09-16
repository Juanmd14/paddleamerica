import type { BadgeTone } from "@/components/ui/badge";
import type { Player, Tournament } from "@/types/models";

const GENDER_LABELS: Record<string, string> = {
  masculino: "Masculino",
  femenino: "Femenino",
  mixto: "Mixto",
};

const SIDE_LABELS: Record<string, string> = {
  drive: "Drive",
  reves: "Revés",
};

const TOURNAMENT_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  inscripciones: { label: "Inscripciones abiertas", tone: "success" },
  proximo: { label: "Próximamente", tone: "accent" },
  en_juego: { label: "En juego", tone: "primary" },
  finalizado: { label: "Finalizado", tone: "neutral" },
};

const FEATURED_LABELS: Record<string, string> = {
  principal: "Torneo principal",
  sponsor: "Sponsoreado",
};

/** "Torneo principal", "Sponsoreado por Bandeja Club" o null si no está destacado. */
export function featuredLabel(
  tournament: Pick<Tournament, "featured" | "sponsor_name">,
) {
  const label = tournament.featured && FEATURED_LABELS[tournament.featured];
  if (!label) return null;
  return tournament.featured === "sponsor" && tournament.sponsor_name
    ? `${label} por ${tournament.sponsor_name}`
    : label;
}

export const featuredOptions = Object.entries(FEATURED_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export function genderLabel(gender: string) {
  return GENDER_LABELS[gender] ?? gender;
}

export function sideLabel(side: string) {
  return SIDE_LABELS[side] ?? side;
}

export function tournamentStatus(status: string) {
  return (
    TOURNAMENT_STATUS[status] ?? { label: status, tone: "neutral" as const }
  );
}

export function playerName(player: Pick<Player, "first_name" | "last_name">) {
  return `${player.first_name} ${player.last_name}`;
}

const REGISTRATION_STATUS: Record<string, { label: string; tone: BadgeTone }> =
  {
    invitacion: { label: "Esperando a la pareja", tone: "accent" },
    pendiente: { label: "Pendiente de confirmación", tone: "primary" },
    confirmada: { label: "Confirmada", tone: "success" },
    rechazada: { label: "Rechazada", tone: "danger" },
    cancelada: { label: "Cancelada", tone: "danger" },
  };

export function registrationStatus(status: string) {
  return (
    REGISTRATION_STATUS[status] ?? { label: status, tone: "neutral" as const }
  );
}

/** Porcentaje de partidos ganados (0 a 100). */
export function effectiveness(
  player: Pick<Player, "matches_won" | "matches_played">,
) {
  return player.matches_played > 0
    ? Math.round((player.matches_won / player.matches_played) * 100)
    : 0;
}

/** Opciones para los selects del panel de administración. */
export const tournamentStatusOptions = Object.entries(TOURNAMENT_STATUS).map(
  ([value, { label }]) => ({ value, label }),
);
export const tournamentGenderOptions = Object.entries(GENDER_LABELS).map(
  ([value, label]) => ({ value, label }),
);
export const playerGenderOptions = tournamentGenderOptions.filter(
  (option) => option.value !== "mixto",
);
export const sideOptions = Object.entries(SIDE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

// ---------------------------------------------------------------------
// Números del inicio
// ---------------------------------------------------------------------

export const STAT_KEYS = [
  "players",
  "tournaments_year",
  "tournaments_month",
  "venues",
  "cities",
  "clubs",
  "registrations_year",
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export type StatSetting = {
  key: StatKey;
  /** Título propio; null usa el automático. */
  label?: string | null;
  /** Número corregido a mano; null usa el automático. */
  value?: number | null;
};

export const DEFAULT_STATS: StatSetting[] = [
  { key: "players" },
  { key: "tournaments_year" },
  { key: "tournaments_month" },
  { key: "cities" },
];

/** Título automático de cada número ("Torneos en 2026", "Torneos en septiembre"). */
export function statLabel(
  key: StatKey,
  { year, monthName }: { year: string; monthName: string },
) {
  const labels: Record<StatKey, string> = {
    players: "Jugadores en el ranking",
    tournaments_year: `Torneos en ${year}`,
    tournaments_month: `Torneos en ${monthName}`,
    venues: "Sedes",
    cities: "Ciudades",
    clubs: "Clubes",
    registrations_year: `Parejas inscriptas en ${year}`,
  };
  return labels[key];
}

// ---------------------------------------------------------------------
// Cupos
// ---------------------------------------------------------------------

export type SpotsInfo = {
  capacity: number;
  taken: number;
  left: number;
  full: boolean;
  percent: number;
};

/** Estado del cupo de un torneo. Null si el torneo no tiene cupo. */
export function spotsInfo(
  capacity: number | null,
  taken = 0,
): SpotsInfo | null {
  if (!capacity) return null;
  return {
    capacity,
    taken,
    left: Math.max(capacity - taken, 0),
    full: taken >= capacity,
    percent: Math.min(100, Math.round((taken / capacity) * 100)),
  };
}

// ---------------------------------------------------------------------
// Ranking por categoría
// ---------------------------------------------------------------------

/**
 * Las categorías del pádel, de principiantes para arriba.
 *
 * El cliente las nombra así en el brief: 8va (principiantes), 7ma, 6ta, 5ta,
 * 4ta, 3ra, 2da y 1ra. Este es un circuito local, donde no hay jugadores de
 * primera, así que el ranking arranca en 8va: de ahí sale tanto el orden de
 * los filtros como la categoría por defecto, que es CATEGORIES[0].
 */
export const CATEGORIES = [
  "8va",
  "7ma",
  "6ta",
  "5ta",
  "4ta",
  "3ra",
  "2da",
  "1ra",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: unknown): value is Category {
  return CATEGORIES.includes(value as Category);
}

/** "1ra caballeros", "5ta damas". Así lo nombra el circuito. */
export function rankingTitle(category: string, gender: string) {
  return `${category} ${gender === "femenino" ? "damas" : "caballeros"}`;
}

/**
 * Cómo nombra el circuito a cada rama. En pádel se dice "caballeros" y "damas",
 * no "masculino" y "femenino": eso último queda para el dato crudo.
 */
export function branchLabel(gender: string) {
  return gender === "femenino" ? "Damas" : "Caballeros";
}

/** "F. Medina": en pantallas chicas el nombre entra abreviado. */
export function shortPlayerName(
  player: Pick<Player, "first_name" | "last_name">,
) {
  return `${player.first_name[0]}. ${player.last_name}`;
}
