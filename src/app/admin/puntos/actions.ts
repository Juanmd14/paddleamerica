"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { normalizeCategory } from "@/lib/categories";
import { getRanking } from "@/lib/data";
import { playerName } from "@/lib/labels";
import {
  type ImportMode,
  type ImportRow,
  normalizeText,
  parseGender,
  parseWholeNumber,
  rowName,
} from "@/lib/points-import";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { Json } from "@/types/database.types";

const MAX_ROWS = 2000;

export type PlayerOption = {
  id: number;
  name: string;
  gender: string;
  category: string;
  club: string;
  city: string;
  points: number;
  active: boolean;
};

export type PreviewRow = {
  line: number;
  name: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  category: string;
  club: string;
  city: string;
  /** Null: el archivo no trae puntos para esta fila (solo en padrón). */
  points: number | null;
  matchesPlayed: number | null;
  matchesWon: number | null;
  titles: number | null;
  /** exact: un jugador; ambiguous: varios con ese nombre; none: no está. */
  match: "exact" | "ambiguous" | "none";
  playerId: number | null;
  candidates: number[];
  /** La celda de puntos está vacía: no jugó, la fila no se toca. */
  noPoints?: boolean;
  error?: string;
};

export type PreviewResult =
  { rows: PreviewRow[]; players: PlayerOption[] } | { message: string };

function isMode(mode: string): mode is ImportMode {
  return mode === "reemplazar" || mode === "sumar" || mode === "padron";
}

/** Valida las filas y las relaciona con los jugadores: por código y, si no hay, por nombre (+ rama). */
export async function previewPointsImport(
  rows: ImportRow[],
  mode: ImportMode,
): Promise<PreviewResult> {
  await requireAdmin();
  if (!isMode(mode)) return { message: "Elegí si la carga reemplaza o suma." };
  if (rows.length === 0) {
    return { message: "El archivo no tiene filas con datos." };
  }
  if (rows.length > MAX_ROWS) {
    return { message: `El archivo tiene más de ${MAX_ROWS} filas.` };
  }

  const players = await getRanking({ includeInactive: true });
  const byName = new Map<string, typeof players>();
  for (const player of players) {
    for (const key of [
      normalizeText(`${player.first_name} ${player.last_name}`),
      normalizeText(`${player.last_name} ${player.first_name}`),
    ]) {
      byName.set(key, [...(byName.get(key) ?? []), player]);
    }
  }

  const seen = new Map<number, number>();
  const preview = rows.map((row): PreviewRow => {
    const { firstName, lastName } = rowName(row);
    const name =
      [firstName, lastName].filter(Boolean).join(" ") || row.code || "";
    const points = parseWholeNumber(row.points);
    const matchesPlayed = parseWholeNumber(row.matchesPlayed);
    const matchesWon = parseWholeNumber(row.matchesWon);
    const titles = parseWholeNumber(row.titles);
    const gender = parseGender(row.gender);

    // La categoría se guarda siempre como la escribe el circuito ("6ta"):
    // players.category es texto libre y el ranking filtra con un igual exacto.
    const rawCategory = (row.category ?? "").trim();
    const category = normalizeCategory(rawCategory);

    const base: PreviewRow = {
      line: row.line,
      name,
      firstName,
      lastName,
      gender,
      category: category ?? "",
      club: row.club ?? "",
      city: row.city ?? "",
      points: Number.isFinite(points) ? (points ?? 0) : 0,
      matchesPlayed: Number.isFinite(matchesPlayed) ? matchesPlayed : null,
      matchesWon: Number.isFinite(matchesWon) ? matchesWon : null,
      titles: Number.isFinite(titles) ? titles : null,
      match: "none",
      playerId: null,
      candidates: [],
    };

    // En el padrón lo que se carga es la ficha: sin puntos la fila vale igual.
    if (points === null) {
      if (mode !== "padron") return { ...base, noPoints: true };
      base.points = null;
    }
    if (!name) return { ...base, error: "Falta el nombre o el código." };
    if (rawCategory && !category) {
      return {
        ...base,
        error: `"${rawCategory}" no es una categoría: poné de 1ra a 8va.`,
      };
    }
    if (Number.isNaN(points)) {
      return { ...base, error: "Los puntos tienen que ser un número entero." };
    }
    if ([matchesPlayed, matchesWon, titles].some(Number.isNaN)) {
      return {
        ...base,
        error: "PJ, PG y títulos tienen que ser números enteros.",
      };
    }
    if (
      mode !== "sumar" &&
      matchesPlayed !== null &&
      matchesWon !== null &&
      matchesWon > matchesPlayed
    ) {
      return { ...base, error: "PG no puede ser mayor que PJ." };
    }

    let candidates = row.code
      ? players.filter((player) => player.slug === slugify(row.code ?? ""))
      : [];
    if (candidates.length === 0) {
      candidates = byName.get(normalizeText(`${firstName} ${lastName}`)) ?? [];
      if (gender) {
        candidates = candidates.filter((player) => player.gender === gender);
      }
    }
    candidates = [
      ...new Map(candidates.map((player) => [player.id, player])).values(),
    ];

    if (candidates.length === 1) {
      const playerId = candidates[0].id;
      const previousLine = seen.get(playerId);
      if (previousLine !== undefined) {
        return {
          ...base,
          match: "exact",
          playerId,
          candidates: [playerId],
          error: `Jugador repetido (ya está en la fila ${previousLine}).`,
        };
      }
      seen.set(playerId, row.line);
      return { ...base, match: "exact", playerId, candidates: [playerId] };
    }
    if (candidates.length > 1) {
      return {
        ...base,
        match: "ambiguous",
        candidates: candidates.map((player) => player.id),
      };
    }
    return base;
  });

  return {
    rows: preview,
    players: players.map((player) => ({
      id: player.id,
      name: playerName(player),
      gender: player.gender,
      category: player.category,
      club: player.club ?? "",
      city: player.city ?? "",
      points: player.ranking_points,
      active: player.active,
    })),
  };
}

export type ApplyRow = {
  line: number;
  /** Jugador existente, o null para crear uno nuevo. */
  playerId: number | null;
  firstName: string;
  lastName: string;
  gender: string;
  category: string;
  club: string;
  city: string;
  /** Null: el archivo no trae puntos, los del jugador quedan como están. */
  points: number | null;
  matchesPlayed: number | null;
  matchesWon: number | null;
  titles: number | null;
  /**
   * Solo en padrón y solo para jugadores que ya existen: lo que el archivo le
   * corrige de la ficha. Lo que viene vacío no se toca.
   */
  profile?: {
    category: string;
    gender: string;
    club: string;
    city: string;
  };
};

export type ApplyResult =
  | { ok: true; updated: number; created: number }
  | { ok: false; message: string };

const isWhole = (value: number | null) =>
  value === null || (Number.isInteger(value) && value >= 0);

export async function applyPointsImport(input: {
  fileName: string;
  mode: ImportMode;
  label: string;
  rows: ApplyRow[];
}): Promise<ApplyResult> {
  await requireAdmin();
  const { mode, rows } = input;
  if (!isMode(mode)) return { ok: false, message: "Modo de carga inválido." };
  if (rows.length === 0)
    return { ok: false, message: "No hay filas para aplicar." };
  if (rows.length > MAX_ROWS)
    return { ok: false, message: "Demasiadas filas." };

  const players = await getRanking({ includeInactive: true });
  const existingIds = new Set(players.map((player) => player.id));
  const slugs = new Set(players.map((player) => player.slug));
  const usedIds = new Set<number>();
  const payload: Json[] = [];

  for (const row of rows) {
    const fail = (message: string): ApplyResult => ({
      ok: false,
      message: `Fila ${row.line}: ${message}`,
    });
    if (
      ![row.points, row.matchesPlayed, row.matchesWon, row.titles].every(
        isWhole,
      )
    ) {
      return fail("los números tienen que ser enteros y positivos.");
    }
    const stats = {
      points: row.points,
      matches_played: row.matchesPlayed,
      matches_won: row.matchesWon,
      titles: row.titles,
    };

    if (row.playerId !== null) {
      if (!existingIds.has(row.playerId))
        return fail("el jugador ya no existe.");
      if (usedIds.has(row.playerId)) return fail("jugador repetido.");
      usedIds.add(row.playerId);
      // Solo el padrón corrige la ficha, y solo con lo que el archivo trae.
      const profile =
        mode === "padron" && row.profile
          ? {
              category: normalizeCategory(row.profile.category) ?? "",
              gender: row.profile.gender.trim(),
              club: row.profile.club.trim(),
              city: row.profile.city.trim(),
            }
          : null;
      if (profile && row.profile?.category.trim() && !profile.category) {
        return fail("la categoría tiene que ser de 1ra a 8va.");
      }
      payload.push({
        player_id: row.playerId,
        ...stats,
        ...(profile ? { profile } : {}),
      });
      continue;
    }

    const firstName = row.firstName.trim();
    const lastName = row.lastName.trim();
    const category = normalizeCategory(row.category);
    if (firstName.length < 2 || lastName.length < 2) {
      return fail("para crear el jugador hace falta nombre y apellido.");
    }
    if (row.gender !== "masculino" && row.gender !== "femenino") {
      return fail("elegí la rama del jugador nuevo.");
    }
    if (!category) {
      return fail("elegí una categoría de 1ra a 8va para el jugador nuevo.");
    }

    const baseSlug = slugify(`${firstName} ${lastName}`);
    let slug = baseSlug;
    for (let suffix = 2; slugs.has(slug); suffix++)
      slug = `${baseSlug}-${suffix}`;
    slugs.add(slug);

    payload.push({
      player_id: null,
      ...stats,
      new_player: {
        slug,
        first_name: firstName,
        last_name: lastName,
        gender: row.gender,
        category,
        club: row.club.trim(),
        city: row.city.trim(),
      },
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("apply_points_import", {
    p_file_name: input.fileName.slice(0, 200),
    p_mode: mode,
    p_label: input.label.trim().slice(0, 120),
    p_rows: payload,
  });
  if (error) {
    console.error("[carga de puntos]", error);
    const message =
      error.code === "23514"
        ? "Con esta carga algún jugador quedaría con más partidos ganados que jugados. Revisá PJ y PG."
        : error.code === "23505"
          ? "Se repite el código de un jugador nuevo. Probá de nuevo."
          : error.message.includes("categoria_del_jugador_invalida")
            ? "Alguno de los jugadores tiene una cuenta vinculada y la categoría del archivo no es de 1ra a 8va."
            : "No pudimos aplicar la carga. No se modificó ningún jugador.";
    return { ok: false, message };
  }

  revalidateRankingPages();
  const result = data as { updated: number; created: number };
  return { ok: true, updated: result.updated, created: result.created };
}

export async function undoLastPointsImport(): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("undo_last_points_import");
  if (error) {
    console.error("[deshacer carga]", error);
    redirect(
      `/admin/puntos?error=${encodeURIComponent("No pudimos deshacer la última carga.")}`,
    );
  }
  revalidateRankingPages();
  redirect("/admin/puntos?deshecha=1");
}

function revalidateRankingPages() {
  for (const path of [
    "/",
    "/jugadores",
    "/admin",
    "/admin/jugadores",
    "/admin/puntos",
  ]) {
    revalidatePath(path);
  }
  revalidatePath("/jugadores/[slug]", "page");
}
