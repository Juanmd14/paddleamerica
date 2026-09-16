import Image from "next/image";
import { formatNumber } from "@/lib/format";
import { playerName, shortPlayerName } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Player } from "@/types/models";

/**
 * El top 4 de una categoría sobre la cancha vista desde arriba.
 *
 * La cancha no es un fondo: es la grilla. Sus cuatro cuadrantes reales son las
 * cuatro posiciones del podio. La foto ya trae la red, las líneas y hasta la
 * pelota, así que no se dibuja nada encima: solo un velo parejo para que los
 * datos se lean.
 *
 * La cancha se muestra entera: recortarle el fondo la deja viéndose cortada. Lo
 * único que le saca el script son los 29 px de encuadre de más que tenía la
 * foto de un lado, para que las dos líneas de saque queden a la misma
 * distancia del borde. Ver scripts/cortar-cancha.mjs.
 */

export const CANCHA = "/cancha/completa.jpg";

/*
 * Geometría medida sobre `completa.jpg` (1507 × 1024), que el script deja ya
 * emparejada:
 *
 *   línea de saque izquierda    7,2 %      red (centro)   49,8 %
 *   línea de saque derecha     92,9 %      línea central  49,9 %
 *
 * Al estar las dos líneas a la misma distancia de su borde, alcanza un solo
 * número para los dos lados: los bloques se apoyan por DENTRO de su línea y
 * leen hacia el centro, con el mismo aire de un lado y del otro.
 */
const AIRE = 1.5;
const DESDE_LA_LINEA = `${(7.15 + AIRE).toFixed(2)}%`;

/** Colores de recuadro cuando el jugador no tiene foto, en orden de podio. */
const ZONE_COLORS = ["#3d5cf5", "#00706f", "#5f3fd8", "#b0456b"];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

type Slot = { position: number; player: Player | undefined };

function slots(players: Player[]): Slot[] {
  return [0, 1, 2, 3].map((index) => ({
    position: index + 1,
    player: players[index],
  }));
}

/** Recuadro con la foto del jugador o sus iniciales. Cuadrado, nunca redondo. */
function PlayerTile({
  player,
  position,
}: {
  player: Player;
  position: number;
}) {
  const name = playerName(player);

  return (
    <span
      className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden border border-vidrio-texto/70 font-titulo text-sm font-bold text-white sm:size-12 sm:text-base md:size-14 md:text-lg"
      style={{ background: ZONE_COLORS[position - 1] }}
    >
      {player.photo_url ? (
        <Image
          src={player.photo_url}
          alt={name}
          fill
          sizes="112px"
          className="object-cover"
        />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
}

export type CourtPodiumProps = {
  /** Del 1 al 4, ya ordenados por puntos. Puede venir con menos. */
  players: Player[];
  /** "1ra caballeros", "5ta damas"... */
  title: string;
  /** "Actualizado al 10 de septiembre de 2026" */
  eyebrow?: string;
  /** Foto cenital de la cancha. Se usa entera. */
  photo?: string;
  className?: string;
};

export function CourtPodium({
  players,
  title,
  eyebrow,
  photo = CANCHA,
  className,
}: CourtPodiumProps) {
  return (
    <section
      className={cn("bg-vidrio-noche text-vidrio-texto", className)}
      aria-label={`Top 4 de ${title}`}
    >
      <div className="px-4 pt-5 sm:px-6 md:pt-7">
        {eyebrow ? (
          <p className="font-dato text-[10px] font-bold tracking-[0.18em] text-vidrio-pelota uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 font-titulo text-[30px] leading-[0.92] font-extrabold tracking-[-0.02em] uppercase sm:text-[38px] md:text-[46px]">
          {title}
        </h2>
      </div>

      {/*
        La cancha es 3:2, así que a todo el ancho se come la pantalla entera y
        el 3 y el 4 quedan abajo del pliegue. Acotada, las cuatro posiciones
        entran de una sola mirada, que es de lo que se trata un podio.
      */}
      <div className="px-4 pt-4 pb-6 sm:px-6 md:pb-8">
        <div className="relative mx-auto aspect-[1507/1024] max-w-3xl overflow-hidden">
          <Image
            src={photo}
            alt=""
            fill
            sizes="(min-width: 1024px) 960px, 100vw"
            className="object-cover"
            priority
            aria-hidden="true"
          />
          {/* Velo parejo: apaga la cancha lo justo para que los datos se lean. */}
          <span
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                "color-mix(in srgb, var(--color-vidrio-noche) 40%, transparent)",
            }}
          />

          {slots(players).map(({ position, player }) => {
            const derecha = position === 2 || position === 4;
            const abajo = position === 3 || position === 4;

            return (
              <div
                key={position}
                className={cn(
                  "absolute flex w-[38%] items-center gap-2 sm:w-auto sm:gap-3",
                  derecha && "flex-row-reverse text-right",
                )}
                style={{
                  [derecha ? "right" : "left"]: DESDE_LA_LINEA,
                  [abajo ? "bottom" : "top"]: "9%",
                }}
              >
                {player ? (
                  <>
                    <PlayerTile player={player} position={position} />
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block font-titulo text-2xl leading-[0.88] font-extrabold sm:text-[26px] md:text-[30px]",
                          position === 1 && "text-vidrio-pelota",
                        )}
                      >
                        {position}
                      </span>
                      <span className="mt-1 block truncate font-dato text-xs leading-none font-semibold sm:mt-1.5 sm:text-sm md:text-[15px]">
                        <span className="sm:hidden">
                          {shortPlayerName(player)}
                        </span>
                        <span className="hidden sm:inline">
                          {playerName(player)}
                        </span>
                      </span>
                      <span className="mt-1 block font-dato text-[11px] leading-none font-bold text-vidrio-texto/75 sm:mt-1.5 sm:text-[13px]">
                        {formatNumber(player.ranking_points)}
                        <span className="hidden sm:inline"> PTS</span>
                      </span>
                    </span>
                  </>
                ) : (
                  <span className="font-dato text-[10px] font-bold tracking-[0.18em] text-vidrio-texto/60 uppercase">
                    Libre
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
