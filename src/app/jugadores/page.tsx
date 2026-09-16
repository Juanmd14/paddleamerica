import type { Metadata } from "next";
import Link from "next/link";
import { CourtPodium } from "@/components/court-podium";
import { RankingTable } from "@/components/ranking-table";
import {
  getCategoryCounts,
  getRanking,
  getRankingTrends,
} from "@/lib/data";
import {
  branchLabel,
  CATEGORIES,
  isCategory,
  rankingTitle,
} from "@/lib/labels";
import { cn, firstParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ranking",
};

const GENDERS = ["masculino", "femenino"] as const;

/** Cuántos entran en la cancha del hero. El resto va a la tabla. */
const EN_LA_CANCHA = 4;

const TEMPORADA = "2026";
const ACTUALIZADO = "10 de septiembre de 2026";

export default async function PlayersPage({
  searchParams,
}: PageProps<"/jugadores">) {
  const { rama, categoria } = await searchParams;

  const gender = firstParam(rama) === "femenino" ? "femenino" : "masculino";
  const raw = firstParam(categoria);
  const category = isCategory(raw) ? raw : CATEGORIES[0];

  const [players, counts] = await Promise.all([
    getRanking({ gender, category }),
    getCategoryCounts(gender),
  ]);

  // Sobre la categoría entera, para que los puestos subidos sean los reales.
  const trends = await getRankingTrends(players);

  const podio = players.slice(0, EN_LA_CANCHA);
  const resto = players.slice(EN_LA_CANCHA);

  const href = (next: { rama?: string; categoria?: string }) =>
    `/jugadores?rama=${next.rama ?? gender}&categoria=${next.categoria ?? category}`;

  return (
    <div className="bg-vidrio-noche pb-20 text-vidrio-texto">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="sr-only">Ranking del circuito</h1>

        <section
          aria-label="Filtros del ranking"
          className="border-b border-vidrio-linea px-4 pt-8 pb-7 sm:px-6"
        >
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-dato text-[10px] font-bold tracking-[0.18em] text-vidrio-pelota uppercase">
              Ranking regional
            </p>
            <p className="font-dato text-[10px] font-bold tracking-[0.14em] text-vidrio-tenue uppercase">
              Temporada {TEMPORADA}
            </p>
          </div>

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

        <CourtPodium
          players={podio}
          title={rankingTitle(category, gender)}
          eyebrow={`Actualizado al ${ACTUALIZADO}`}
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
            startAt={EN_LA_CANCHA + 1}
            trends={trends}
            className="border-t border-vidrio-linea"
          />
        ) : null}

        {/* Ficha de cierre: los datos que hacen falta para confiar en la tabla. */}
        <dl className="grid grid-cols-2 border-t border-vidrio-linea md:grid-cols-4">
          <Dato termino="Jugadores" valor={String(players.length)} />
          <Dato termino="Categoría" valor={rankingTitle(category, gender)} />
          <Dato termino="Actualizado" valor={ACTUALIZADO} />
          <Dato
            termino="Se actualiza"
            valor="Después de cada torneo del circuito"
          />
        </dl>
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
