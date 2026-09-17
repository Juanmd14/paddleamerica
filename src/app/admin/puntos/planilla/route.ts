import { getCurrentUser } from "@/lib/auth";
import { getRanking } from "@/lib/data";
import { branchLabel } from "@/lib/labels";
import type { ImportMode } from "@/lib/points-import";
import { pointsTemplateResponse } from "@/lib/points-template";

/**
 * Planilla .xlsx con los jugadores, lista para completar y volver a subir.
 *
 * ?tipo=torneo   puntos vacíos para anotar lo que ganó cada uno en un torneo
 *                (se suman). Solo jugadores que compiten.
 * ?tipo=totales  con los totales actuales, para corregirlos (se reemplazan).
 * ?rama=         masculino, femenino o vacío para las dos juntas.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return new Response("No encontrado", { status: 404 });

  const params = new URL(request.url).searchParams;
  const rama = params.get("rama");
  const gender = rama === "masculino" || rama === "femenino" ? rama : undefined;
  const mode: ImportMode =
    params.get("tipo") === "torneo" ? "sumar" : "reemplazar";

  const players = await getRanking({
    gender,
    includeInactive: mode === "reemplazar",
  });
  const fileName = [
    "planilla",
    mode === "sumar" ? "torneo" : "totales",
    gender && branchLabel(gender).toLowerCase(),
  ]
    .filter(Boolean)
    .join("-");

  return pointsTemplateResponse(players, mode, fileName);
}
