/**
 * Carga de puntos desde Excel/CSV: funciones puras que usan tanto el navegador
 * (leer el archivo y detectar columnas) como el servidor (validar y relacionar jugadores).
 */

export type ImportMode = "reemplazar" | "sumar";

/**
 * Título de la columna de puntos en cada planilla modelo. Al subirla, de ahí
 * se deduce si los puntos se suman (torneo) o reemplazan (totales).
 */
export const TEMPLATE_POINTS_HEADER = {
  sumar: "Puntos del torneo",
  reemplazar: "Puntos totales",
} satisfies Record<ImportMode, string>;

/** Si el encabezado es el de una planilla modelo, qué tipo de carga es. */
export function suggestMode(header: string[]): ImportMode | null {
  const titles = header.map(normalizeText);
  for (const mode of ["sumar", "reemplazar"] as const) {
    if (titles.includes(normalizeText(TEMPLATE_POINTS_HEADER[mode]))) {
      return mode;
    }
  }
  return null;
}

export const COLUMN_FIELDS = [
  { key: "code", label: "Código" },
  { key: "fullName", label: "Nombre y apellido" },
  { key: "firstName", label: "Nombre" },
  { key: "lastName", label: "Apellido" },
  { key: "gender", label: "Rama" },
  { key: "category", label: "Categoría" },
  { key: "club", label: "Club" },
  { key: "city", label: "Ciudad" },
  { key: "points", label: "Puntos" },
  { key: "matchesPlayed", label: "PJ" },
  { key: "matchesWon", label: "PG" },
  { key: "titles", label: "Títulos" },
] as const;

export type ColumnKey = (typeof COLUMN_FIELDS)[number]["key"];
/** Índice de columna del archivo para cada campo (null = no está). */
export type ColumnMapping = Record<ColumnKey, number | null>;

/** Una fila del archivo ya leída con el mapeo de columnas (todo texto). */
export type ImportRow = {
  line: number;
} & Partial<Record<ColumnKey, string>>;

const HEADER_ALIASES: Record<ColumnKey, string[]> = {
  code: ["codigo", "cod", "slug", "id"],
  fullName: [
    "jugador",
    "jugadora",
    "nombre y apellido",
    "apellido y nombre",
    "nombre completo",
  ],
  firstName: ["nombre", "nombres"],
  lastName: ["apellido", "apellidos"],
  gender: ["rama", "genero", "sexo"],
  category: ["categoria", "cat"],
  club: ["club"],
  city: ["ciudad", "localidad"],
  points: [
    "puntos",
    "pts",
    "puntaje",
    "total",
    "puntos totales",
    "puntos del torneo",
  ],
  matchesPlayed: ["pj", "partidos jugados", "jugados"],
  matchesWon: ["pg", "partidos ganados", "ganados"],
  titles: ["titulos", "campeonatos"],
};

/** Sin tildes, en minúsculas y con espacios simples: "  Martín  GÓMEZ " → "martin gomez". */
export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Lee un CSV con "," o ";" (el que más aparezca en la primera línea) y comillas. */
export function parseCsv(text: string): string[][] {
  const content = text.replace(/^\uFEFF/, "");
  const firstLine = content.split(/\r?\n/, 1)[0] ?? "";
  const delimiter =
    (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0)
      ? ";"
      : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < content.length; index++) {
    const char = content[index];
    if (quoted) {
      if (char === '"' && content[index + 1] === '"') {
        cell += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && content[index + 1] === "\n") index++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** Detecta qué columna es cada campo mirando el encabezado. */
export function detectColumns(header: string[]): ColumnMapping {
  const normalized = header.map(normalizeText);
  const mapping = Object.fromEntries(
    COLUMN_FIELDS.map(({ key }) => [key, null]),
  ) as ColumnMapping;
  const used = new Set<number>();

  // Primero coincidencias exactas, después las que empiezan igual ("puntos 2026").
  for (const exact of [true, false]) {
    for (const { key } of COLUMN_FIELDS) {
      if (mapping[key] !== null) continue;
      const index = normalized.findIndex(
        (title, position) =>
          !used.has(position) &&
          HEADER_ALIASES[key].some((alias) =>
            exact ? title === alias : title.startsWith(`${alias} `),
          ),
      );
      if (index !== -1) {
        mapping[key] = index;
        used.add(index);
      }
    }
  }

  // Si hay "Nombre y apellido" no hace falta "Nombre" suelto y viceversa.
  if (mapping.fullName !== null && mapping.lastName === null) {
    mapping.firstName = null;
  }
  return mapping;
}

/** La primera fila con contenido es el encabezado; el resto son datos. */
export function splitSheet(sheet: string[][]) {
  const nonEmpty = (row: string[]) => row.some((cell) => cell.trim() !== "");
  const headerIndex = sheet.findIndex(nonEmpty);
  if (headerIndex === -1) return { header: [], body: [] };

  return {
    header: sheet[headerIndex].map((cell) => cell.trim()),
    body: sheet
      .map((row, index) => ({ row, line: index + 1 }))
      .slice(headerIndex + 1)
      .filter(({ row }) => nonEmpty(row)),
  };
}

export function applyMapping(
  body: { row: string[]; line: number }[],
  mapping: ColumnMapping,
): ImportRow[] {
  return body.map(({ row, line }) => {
    const result: ImportRow = { line };
    for (const { key } of COLUMN_FIELDS) {
      const index = mapping[key];
      if (index !== null) result[key] = (row[index] ?? "").trim();
    }
    return result;
  });
}

/** "1.250" → 1250, "980" → 980, "" → null. NaN si no es un entero ≥ 0. */
export function parseWholeNumber(value: string | undefined) {
  const text = (value ?? "").replace(/\s/g, "");
  if (text === "") return null;
  const digits = /^\d{1,3}(\.\d{3})+$/.test(text)
    ? text.replaceAll(".", "")
    : text;
  return /^\d+$/.test(digits) ? Number(digits) : Number.NaN;
}

export function parseGender(value: string | undefined) {
  const text = normalizeText(value ?? "");
  if (["masculino", "m", "caballeros", "hombres", "varones"].includes(text)) {
    return "masculino";
  }
  if (["femenino", "f", "damas", "mujeres"].includes(text)) return "femenino";
  return null;
}

/** Separa "Apellido, Nombre" o "Nombre Apellido" (el apellido es la última palabra). */
export function splitFullName(fullName: string) {
  const [before, after] = fullName.split(",").map((part) => part.trim());
  if (after) return { firstName: after, lastName: before };
  const words = fullName.trim().split(/\s+/);
  if (words.length < 2) return { firstName: words[0] ?? "", lastName: "" };
  return {
    firstName: words.slice(0, -1).join(" "),
    lastName: words[words.length - 1],
  };
}

/** Nombre completo de la fila, venga en una o dos columnas. */
export function rowName(row: ImportRow) {
  if (row.firstName || row.lastName) {
    return {
      firstName: row.firstName ?? "",
      lastName: row.lastName ?? "",
    };
  }
  return splitFullName(row.fullName ?? "");
}
