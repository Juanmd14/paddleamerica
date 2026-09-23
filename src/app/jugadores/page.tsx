import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EN_EL_PODIO, Podium } from "@/components/podium";
import { PlayerSearchResults } from "@/components/player-search-results";
import { RankingTable } from "@/components/ranking-table";
import {
  getCategoryCounts,
  getRanking,
  getRankingTrends,
  getRankingUpdatedAt,
  searchPlayers,
} from "@/lib/data";
import { currentYear, formatDate } from "@/lib/format";
import {
  branchLabel,
  CATEGORIES,
  isCategory,
  rankingTitle,
} from "@/lib/labels";
import { cn, firstParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Categorías",
};

const GENDERS = ["masculino", "femenino"] as const;

export default async function PlayersPage({
  searchParams,
}: PageProps<"/jugadores">) {
  const { rama, categoria, q } = await searchParams;

  const gender = firstParam(rama) === "femenino" ? "femenino" : "masculino";
  const raw = firstParam(categoria);
  const category = isCategory(raw) ? raw : CATEGORIES[0];
  const query = (firstParam(q) ?? "").trim().slice(0, 60);

  const [players, counts, updatedAt, results] = await Promise.all([
    getRanking({ gender, category }),
    getCategoryCounts(gender),
    getRankingUpdatedAt(),
    query ? searchPlayers(query) : Promise.resolve(null),
  ]);
  const actualizado = updatedAt ? formatDate(updatedAt) : null;

  // Sobre la categoría entera, para que los puestos subidos sean los reales.
  const trends = await getRankingTrends(players);

  const podio = players.slice(0, EN_EL_PODIO);
  const resto = players.slice(EN_EL_PODIO);

  const href = (next: { rama?: string; categoria?: string }) =>
    `/jugadores?rama=${next.rama ?? gender}&categoria=${next.categoria ?? category}`;

  return (
    <div className="flex-1 bg-vidrio-noche pb-20 text-vidrio-texto">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="sr-only">Categorías del circuito</h1>

        <section
          aria-label="Filtros de las categorías"
          className="border-b border-vidrio-linea px-4 pt-8 pb-7 sm:px-6"
        >
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-dato text-[10px] font-bold tracking-[0.18em] text-vidrio-pelota uppercase">
              Categorías del circuito
            </p>
            <p className="font-dato text-[10px] font-bold tracking-[0.14em] text-vidrio-tenue uppercase">
              Temporada {currentYear()}
            </p>
          </div>

          {/* Buscador: busca en todas las categorías y ramas. Sin JS: Enter envía. */}
          <form
            action="/jugadores"
            role="search"
            className="mt-5 flex items-center gap-2 rounded-lg border border-vidrio-linea bg-vidrio-panel px-3 focus-within:border-vidrio-tenue"
          >
            <input type="hidden" name="rama" value={gender} />
            <input type="hidden" name="categoria" value={category} />
            <Search
              className="size-4 shrink-0 text-vidrio-tenue"
              aria-hidden="true"
            />
            <label htmlFor="buscar-jugador" className="sr-only">
              Buscar jugador
            </label>
            <input
              id="buscar-jugador"
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Buscar jugador por nombre"
              autoComplete="off"
              enterKeyHint="search"
              maxLength={60}
              className="h-11 min-w-0 flex-1 bg-transparent font-dato text-sm text-vidrio-texto placeholder:text-vidrio-tenue focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-md px-2 py-1.5 font-dato text-xs font-bold tracking-[0.08em] text-vidrio-pelota uppercase hover:bg-vidrio-noche"
            >
              Buscar
            </button>
          </form>

          {/*
            La rama es la decisión de más arriba: son dos rankings distintos, no
            un filtro más. Por eso va sola, como interruptor redondeado, bien
            separada de las fichas cuadradas de categoría.
          */}
          <div
            role="group"
            aria-label="Rama"
            className="mt-5 flex rounded-full border border-vidrio-linea bg-vidrio-panel p-1 sm:inline-flex"
          >
            {GENDERS.map((option) => {
              const activa = option === gender;
              return (
                <Link
                  key={option}
                  href={href({ rama: option })}
                  aria-current={activa ? "page" : undefined}
                  className={cn(
                    "flex-1 rounded-full px-6 py-2.5 text-center font-dato text-sm font-bold tracking-[0.06em] uppercase transition-colors sm:px-12",
                    activa
                      ? "bg-vidrio-texto text-vidrio-noche"
                      : "text-vidrio-tenue hover:text-vidrio-texto",
                  )}
                >
                  {branchLabel(option)}
                </Link>
              );
            })}
          </div>

          <div className="mt-7">
            <p className="font-dato text-[10px] font-bold tracking-[0.16em] text-vidrio-tenue uppercase">
              Categoría
            </p>
            <div
              role="group"
              aria-label="Categoría"
              className="mt-2.5 flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1"
            >
              {CATEGORIES.map((option) => {
                const activa = option === category;
                const cuantos = counts[option] ?? 0;

                return (
                  <Link
                    key={option}
                    href={href({ categoria: option })}
                    aria-current={activa ? "page" : undefined}
                    className={cn(
                      "flex min-w-[4.25rem] flex-1 flex-col items-center gap-0.5 rounded-lg border-2 px-3 py-2.5 transition-colors",
                      activa
                        ? "border-vidrio-pelota bg-vidrio-pelota text-vidrio-noche"
                        : cuantos === 0
                          ? "border-vidrio-linea/60 text-vidrio-tenue/45 hover:border-vidrio-linea hover:text-vidrio-tenue"
                          : "border-vidrio-linea text-vidrio-texto hover:border-vidrio-tenue hover:bg-vidrio-panel",
                    )}
                  >
                    <span className="font-titulo text-lg leading-none font-extrabold">
                      {option}
                    </span>
                    <span
                      className={cn(
                        "font-dato text-[10px] leading-none font-bold tracking-[0.08em] uppercase",
                        activa ? "text-vidrio-noche/70" : "text-vidrio-tenue",
                      )}
                    >
                      {cuantos === 0
                        ? "—"
                        : `${cuantos} ${cuantos === 1 ? "jug" : "jugs"}`}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {results ? (
          <section aria-label="Resultados de la búsqueda">
            <div className="flex items-start justify-between gap-4 px-4 pt-6 pb-4 sm:px-6">
              <h2 className="min-w-0 font-titulo text-lg leading-tight font-extrabold break-words uppercase sm:text-xl">
                Resultados para «{query}»
              </h2>
              <Link
                href={href({})}
                className="mt-1 shrink-0 font-dato text-xs font-bold tracking-[0.08em] text-vidrio-pelota uppercase hover:underline"
              >
                Ver categorías
              </Link>
            </div>
            {results.length > 0 ? (
              <div className="border-t border-vidrio-linea">
                <PlayerSearchResults players={results} />
              </div>
            ) : (
              <p className="border-t border-vidrio-linea px-4 py-10 text-center font-dato text-sm text-vidrio-tenue sm:px-6">
                No encontramos jugadores con ese nombre.
              </p>
            )}
          </section>
        ) : (
          <>
            <Podium
              players={podio}
              title={rankingTitle(category, gender)}
              eyebrow={
                actualizado ? `Actualizado al ${actualizado}` : undefined
              }
              trends={trends}
            />

            {players.length === 0 ? (
              <p className="border-t border-vidrio-linea px-4 py-10 text-center font-dato text-sm text-vidrio-tenue sm:px-6">
                Todavía no hay jugadores cargados en{" "}
                {rankingTitle(category, gender)}.
              </p>
            ) : null}

            {resto.length > 0 ? (
              <RankingTable
                players={resto}
                startAt={EN_EL_PODIO + 1}
                trends={trends}
                className="border-t border-vidrio-linea"
              />
            ) : null}

            {/* Ficha de cierre: los datos que hacen falta para confiar en la tabla. */}
            <dl className="grid grid-cols-2 border-t border-vidrio-linea md:grid-cols-4">
              <Dato termino="Jugadores" valor={String(players.length)} />
              <Dato
                termino="Categoría"
                valor={rankingTitle(category, gender)}
              />
              <Dato termino="Actualizado" valor={actualizado ?? "—"} />
              <Dato
                termino="Se actualiza"
                valor="Después de cada torneo del circuito"
              />
            </dl>
          </>
        )}
      </div>
    </div>
  );
}

function Dato({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div className="border-b border-vidrio-linea px-4 py-4 not-last:border-r sm:px-6">
      <dt className="font-dato text-[10px] font-bold tracking-[0.14em] text-vidrio-tenue uppercase">
        {termino}
      </dt>
      <dd className="mt-1.5 font-dato text-sm font-semibold">{valor}</dd>
    </div>
  );
}
