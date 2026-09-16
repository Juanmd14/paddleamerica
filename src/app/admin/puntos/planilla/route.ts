import writeXlsxFile from "write-excel-file/node";
import { getCurrentUser } from "@/lib/auth";
import { getRanking } from "@/lib/data";
import { genderLabel } from "@/lib/labels";

const HEADERS = [
  "Código",
  "Nombre",
  "Apellido",
  "Rama",
  "Categoría",
  "Club",
  "Ciudad",
  "Puntos",
  "PJ",
  "PG",
  "Títulos",
];

/** Planilla .xlsx con los jugadores actuales, lista para completar y volver a subir. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return new Response("No encontrado", { status: 404 });

  const rama = new URL(request.url).searchParams.get("rama");
  const gender = rama === "masculino" || rama === "femenino" ? rama : undefined;
  const players = await getRanking({ gender });

  const header = HEADERS.map((value) => ({
    value,
    fontWeight: "bold" as const,
    backgroundColor: "#FFBB1F",
  }));
  const rows = players.map((player) => [
    player.slug,
    player.first_name,
    player.last_name,
    genderLabel(player.gender),
    player.category,
    player.club ?? "",
    player.city ?? "",
    player.ranking_points,
    player.matches_played,
    player.matches_won,
    player.titles,
  ]);

  const buffer = await writeXlsxFile([header, ...rows], {
    sheet: "Ranking",
    stickyRowsCount: 1,
    columns: [
      { width: 24 },
      { width: 16 },
      { width: 16 },
      { width: 12 },
      { width: 12 },
      { width: 22 },
      { width: 18 },
      { width: 10 },
      { width: 8 },
      { width: 8 },
      { width: 9 },
    ],
  }).toBuffer();

  const suffix = gender ? `-${gender}` : "";
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="planilla-puntos${suffix}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
