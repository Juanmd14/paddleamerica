import { cn } from "@/lib/utils";

/**
 * La red de pádel como elemento del sistema, no como dibujo suelto.
 *
 * Anatomía (del concepto Padel Pocho): cinta sólida arriba, malla de rombos
 * y postes que sobresalen. Tres tamaños con un solo uso cada uno:
 *
 *   hero    18px  borde de la media cancha. La única que lleva postes.
 *   seccion 12px  separador entre bloques del home y del perfil.
 *   tabla    7px  la más finita. Hoy no se usa: la tabla del ranking va sin cortes.
 */
export type NetSize = "hero" | "seccion" | "tabla";

export const netSizes: NetSize[] = ["hero", "seccion", "tabla"];

const SIZES = {
  hero: { cinta: 3, malla: 15, rombo: 6 },
  seccion: { cinta: 2, malla: 10, rombo: 5 },
  tabla: { cinta: 1, malla: 6, rombo: 4 },
} satisfies Record<NetSize, { cinta: number; malla: number; rombo: number }>;

/** Rombos: dos tramas a 45° cruzadas, 1px de trazo. */
function meshStyle(rombo: number) {
  const line = "var(--color-vidrio-red-malla)";
  return {
    backgroundColor: "var(--color-vidrio-red-fondo)",
    backgroundImage: `repeating-linear-gradient(45deg,${line} 0 1px,transparent 1px ${rombo}px),repeating-linear-gradient(-45deg,${line} 0 1px,transparent 1px ${rombo}px)`,
  };
}

export function Net({
  size = "seccion",
  postes = false,
  className,
}: {
  size?: NetSize;
  /** Postes que sobresalen a los costados. Solo en la red hero. */
  postes?: boolean;
  className?: string;
}) {
  const { cinta, malla, rombo } = SIZES[size];
  const alto = cinta + malla;

  return (
    <div
      className={cn("relative", className)}
      style={postes ? { paddingInline: 6 } : undefined}
      aria-hidden="true"
    >
      {postes ? (
        <>
          <span
            className="absolute left-0 w-1.5"
            style={{
              top: -5,
              height: alto + 10,
              background: "var(--color-vidrio-red-poste)",
            }}
          />
          <span
            className="absolute right-0 w-1.5"
            style={{
              top: -5,
              height: alto + 10,
              background: "var(--color-vidrio-red-poste)",
            }}
          />
        </>
      ) : null}
      <div
        style={{ height: cinta, background: "var(--color-vidrio-red-cinta)" }}
      />
      <div style={{ height: malla, ...meshStyle(rombo) }} />
    </div>
  );
}
