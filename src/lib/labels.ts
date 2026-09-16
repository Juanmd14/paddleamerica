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

const REGISTRATION_STATUS: Record<string, { label: string; tone: BadgeTone }> =
  {
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
