import writeXlsxFile from "write-excel-file/node";
import { branchLabel, CATEGORIES } from "@/lib/labels";
import { type ImportMode, TEMPLATE_POINTS_HEADER } from "@/lib/points-import";
import type { Player } from "@/types/models";

const GENDER_ORDER = ["masculino", "femenino"];

/** 8va primero, 1ra al final; lo que no es una categoría conocida, después. */
function categoryIndex(category: string) {
  const index = (CATEGORIES as readonly string[]).indexOf(category);
  return index === -1 ? CATEGORIES.length : index;
}

/**
 * Planilla .xlsx de puntos lista para completar y subir en Carga de puntos.
 * "sumar": puntos vacíos (lo ganado en un torneo). "reemplazar": con los totales.
 */
export async function pointsTemplateResponse(
  players: Player[],
  mode: ImportMode,
  fileName: string,
) {
  const sorted = players.toSorted(
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

  const rows = sorted.map((player) => [
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

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
