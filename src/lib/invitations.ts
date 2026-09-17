/**
 * Mensajes de WhatsApp para avisarle a la pareja. El teléfono de la pareja es
 * privado, así que el link abre WhatsApp y el jugador elige el contacto.
 * Solo en componentes de servidor: siteConfig.url lee variables del servidor.
 */
import { formatDateRange } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import { whatsappShareUrl } from "@/lib/utils";
import type { Tournament } from "@/types/models";

type TournamentInfo = Pick<
  Tournament,
  "name" | "slug" | "starts_on" | "ends_on"
>;

function tournamentUrl(tournament: TournamentInfo) {
  return `${siteConfig.url}/torneos/${tournament.slug}#inscripcion`;
}

/** "¡Hola Juan! Te invité a jugar el …": para quien ya tiene cuenta y fue invitado. */
export function invitationWhatsappUrl(
  partnerName: string,
  tournament: TournamentInfo,
) {
  const firstName = partnerName.trim().split(/\s+/)[0] || "";
  const dates = formatDateRange(tournament.starts_on, tournament.ends_on);
  return whatsappShareUrl(
    `¡Hola ${firstName}! Te invité a jugar el ${tournament.name} (${dates}). Aceptá la invitación acá: ${tournamentUrl(tournament)}`,
  );
}

/** Para una pareja que todavía no tiene cuenta: crear la cuenta y volver al torneo. */
export function signupWhatsappUrl(tournament: TournamentInfo) {
  const dates = formatDateRange(tournament.starts_on, tournament.ends_on);
  const next = encodeURIComponent(`/torneos/${tournament.slug}#inscripcion`);
  return whatsappShareUrl(
    `¡Hola! Quiero anotarme con vos en el ${tournament.name} (${dates}). Creá tu cuenta en ${siteConfig.name} y avisame así te invito: ${siteConfig.url}/login?modo=registro&next=${next}`,
  );
}
