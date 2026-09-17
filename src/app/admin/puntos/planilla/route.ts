import writeXlsxFile from "write-excel-file/node";
import { getCurrentUser } from "@/lib/auth";
import { getRanking } from "@/lib/data";
import { branchLabel, CATEGORIES } from "@/lib/labels";
import { type ImportMode, TEMPLATE_POINTS_HEADER } from "@/lib/points-import";

const GENDER_ORDER = ["masculino", "femenino"];

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

  const players = (
    await getRanking({ gender, includeInactive: mode === "reemplazar" })
  ).toSorted(
    (a, b) =>
      GENDER_ORDER.indexOf(a.gender) - GENDER_ORDER.indexOf(b.gender) ||
      categoryIndex(a.category) - categoryIndex(b.category) ||
      b.ranking_points - a.ranking_points,
  );

  const headers = [
    "Código",
    "Nombre",
    "Apellido",
    "Rama",
    "Categoría",
    "Club",
    "Ciudad",
    TEMPLATE_POINTS_HEADER[mode],
    "PJ",
    "PG",
    "Títulos",
  ];
  const header = headers.map((value, index) => ({
    value,
    fontWeight: "bold" as const,
    // La columna que hay que completar resalta.
    backgroundColor: index === 7 ? "#7FD4A0" : "#FFBB1F",
  }));

  const rows = players.map((player) => [
    player.slug,
    player.first_name,
    player.last_name,
    branchLabel(player.gender),
    player.category,
    player.club ?? "",
    player.city ?? "",
    // En la de torneo, vacío = no jugó (esa fila se ignora al subirla).
    ...(mode === "sumar"
      ? [null, null, null, null]
      : [
          player.ranking_points,
          player.matches_played,
          player.matches_won,
          player.titles,
        ]),
  ]);

  const buffer = await writeXlsxFile([header, ...rows], {
    sheet: mode === "sumar" ? "Torneo" : "Totales",
    stickyRowsCount: 1,
    columns: [
      { width: 24 },
      { width: 16 },
      { width: 16 },
      { width: 12 },
      { width: 11 },
      { width: 22 },
      { width: 18 },
      { width: 18 },
      { width: 8 },
      { width: 8 },
      { width: 9 },
    ],
  }).toBuffer();

  const fileName = [
    "planilla",
    mode === "sumar" ? "torneo" : "totales",
    gender && branchLabel(gender).toLowerCase(),
  ]
    .filter(Boolean)
    .join("-");
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}

/** 8va primero, 1ra al final; lo que no es una categoría conocida, después. */
function categoryIndex(category: string) {
  const index = (CATEGORIES as readonly string[]).indexOf(category);
  return index === -1 ? CATEGORIES.length : index;
}
