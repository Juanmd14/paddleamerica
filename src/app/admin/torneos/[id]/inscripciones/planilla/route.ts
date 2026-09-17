import { getCurrentUser } from "@/lib/auth";
import {
  getPlayersByProfileIds,
  getTournamentById,
  getTournamentRegistrations,
} from "@/lib/data";
import { pointsTemplateResponse } from "@/lib/points-template";

/**
 * Planilla de puntos de un torneo: solo los jugadores de las parejas
 * confirmadas que ya están en el ranking. Se completa y se sube en Carga de
 * puntos (los puntos se suman).
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/admin/torneos/[id]/inscripciones/planilla">,
) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return new Response("No encontrado", { status: 404 });

  const { id } = await params;
  const tournament = await getTournamentById(Number(id));
  if (!tournament) return new Response("No encontrado", { status: 404 });

  const registrations = await getTournamentRegistrations(tournament.id);
  const accountIds = registrations
    .filter((registration) => registration.status === "confirmada")
    .flatMap((registration) =>
      registration.partner_id
        ? [registration.user_id, registration.partner_id]
        : [registration.user_id],
    );
  const players = await getPlayersByProfileIds(accountIds);

  return pointsTemplateResponse(
    players,
    "sumar",
    `planilla-${tournament.slug}`,
  );
}
