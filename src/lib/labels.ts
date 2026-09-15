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
