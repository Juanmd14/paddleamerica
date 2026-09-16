import type { BadgeTone } from "@/components/ui/badge";
import type { Player } from "@/types/models";

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
