import { BookOpen, ChevronDown, Download, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import { undoLastPointsImport } from "@/app/admin/puntos/actions";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { PointsImporter } from "@/components/admin/points-importer";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import {
  getAllTournaments,
  getLastPointsImport,
  getRankingCategories,
} from "@/lib/data";
import { formatDate } from "@/lib/format";
import { firstParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Carga de puntos" };

const templates = [
  {
    tipo: "padron",
    title: "Para cargar el padrón",
    text: "La lista de jugadores con su categoría, sin puntos todavía. Da de alta a los que no están y corrige la ficha de los que sí.",
  },
  {
    tipo: "torneo",
    title: "Para cargar un torneo",
    text: "Puntos vacíos: anotá los que ganó cada uno y dejá vacíos los que no jugaron. Se suman.",
  },
  {
    tipo: "totales",
    title: "Con los totales actuales",
    text: "Para corregir el ranking: cambiá los números que estén mal. Se reemplazan.",
  },
];

const branches = [
  { rama: "masculino", label: "Caballeros" },
  { rama: "femenino", label: "Damas" },
  { rama: "", label: "Las dos juntas" },
];

export default async function PointsImportPage({
  searchParams,
}: PageProps<"/admin/puntos">) {
  await requireAdmin("/admin/puntos");
  const [lastImport, tournaments, men, women, params] = await Promise.all([
    getLastPointsImport(),
    getAllTournaments(),
    getRankingCategories("masculino"),
    getRankingCategories("femenino"),
    searchParams,
  ]);
  const error = firstParam(params.error);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Carga de puntos"
        description="Armá el padrón de jugadores en una planilla y, después de cada torneo, subí los resultados en Excel: el ranking se actualiza solo. Antes de guardar ves exactamente qué cambia."
      />
      {params.deshecha && (
        <Alert tone="success">
          Deshicimos la última carga: los puntos volvieron a como estaban.
        </Alert>
      )}
      {error && <Alert tone="danger">{error}</Alert>}

      <PointsGuide open={!lastImport} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PointsImporter
            tournamentNames={tournaments.map((tournament) => tournament.name)}
            categories={[...new Set([...men, ...women])]}
          />
        </div>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-2xl font-bold uppercase">
              Planillas modelo
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Traen a los jugadores con su <strong>Código</strong>, así cada
              fila se relaciona sin errores. Completá solo la columna verde.
            </p>
            {templates.map((group) => (
              <div key={group.tipo} className="mt-5">
                <p className="text-sm font-semibold">{group.title}</p>
                <p className="text-xs text-muted-foreground">{group.text}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {branches.map((branch) => (
                    <a
                      key={branch.label}
                      href={`/admin/puntos/planilla?tipo=${group.tipo}${branch.rama ? `&rama=${branch.rama}` : ""}`}
                      className={buttonStyles({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      <Download className="size-4" aria-hidden="true" />
                      {branch.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-2xl font-bold uppercase">
              Última carga
            </h2>
            {lastImport ? (
              <>
                <div className="mt-3 space-y-1 text-sm">
                  <p className="font-semibold">
                    {lastImport.label || lastImport.file_name || "Sin nombre"}
                  </p>
                  <p className="text-muted-foreground">
                    {formatDate(lastImport.created_at)} ·{" "}
                    {lastImport.mode === "sumar"
                      ? "Sumó puntos"
                      : "Reemplazó totales"}{" "}
                    · {lastImport.rows_count} jugadores
                    {lastImport.created_player_ids.length > 0 &&
                      ` (${lastImport.created_player_ids.length} nuevos)`}
                  </p>
                </div>
                <form action={undoLastPointsImport} className="mt-4">
                  <ConfirmSubmitButton
                    variant="outline"
                    size="sm"
                    pendingLabel="Deshaciendo…"
                    confirmMessage="¿Deshacer la última carga? Los puntos vuelven a como estaban antes y se borran los jugadores que creó."
                  >
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Deshacer esta carga
                  </ConfirmSubmitButton>
                </form>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Todavía no hay cargas para deshacer.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

const guideSteps = [
  {
    title: "Bajá la planilla modelo",
    text: "“Para cargar el padrón” si todavía estás armando la lista de jugadores; “Para cargar un torneo” si vas a sumar los puntos de una fecha; “Con los totales actuales” si querés corregir el ranking.",
  },
  {
    title: "Completá la planilla",
    text: "En la del padrón, Nombre, Apellido, Rama y Categoría de cada jugador; los puntos podés dejarlos vacíos. En las otras dos, la columna verde con los puntos, y vacío el que no jugó. No cambies el Código.",
  },
  {
    title: "Jugadores nuevos al final",
    text: "Agregá una fila con Nombre, Apellido, Rama y Categoría, y el Código vacío. Se crean al aplicar.",
  },
  {
    title: "Subila, revisá y confirmá",
    text: "Antes de guardar ves quién sube, cuánto, y cualquier fila rara. Si algo quedó mal, “Deshacer esta carga” vuelve todo atrás.",
  },
];

/** Guía corta de la carga. Abierta hasta la primera carga; después, a un toque. */
function PointsGuide({ open }: { open: boolean }) {
  return (
    <Card className="overflow-hidden">
      <details open={open} className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
          <BookOpen
            className="size-5 shrink-0 text-accent"
            aria-hidden="true"
          />
          <span className="flex-1 font-display text-xl font-bold uppercase">
            Cómo cargar los resultados
          </span>
          <ChevronDown
            className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>

        <div className="space-y-6 border-t border-border px-5 py-5 sm:px-6">
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {guideSteps.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary font-display text-base font-bold text-primary-foreground"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold">{step.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-pista-50 p-4 text-sm text-pista-800">
              <p className="font-semibold">¿Damas y caballeros juntos?</p>
              <p className="mt-1">
                Se puede, en un mismo archivo. Cada jugador suma en el ranking
                de su rama y su categoría, así que no se mezclan. Con la
                planilla modelo no hay que hacer nada más. Si usás un Excel
                propio, poné una columna <strong>Rama</strong> (Damas o
                Caballeros): sin ella, los jugadores nuevos se crean todos con
                la misma rama. Antes de confirmar vas a ver cuántas damas y
                cuántos caballeros se cargan.
              </p>
            </div>
            <div className="rounded-lg bg-muted p-4 text-sm text-foreground-soft">
              <p className="font-semibold text-foreground">
                Lo que el Excel no cambia
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>
                  A los jugadores que no están en el archivo o tienen los puntos
                  vacíos.
                </li>
                <li>
                  La rama, la categoría, el club o la ciudad de alguien que ya
                  existe: eso se edita en Jugadores, o con la planilla del
                  padrón. En las cargas de puntos, si la rama o la categoría del
                  archivo no coinciden, te avisamos.
                </li>
                <li>
                  Si alguien “ya no compite”, los puntos se cargan igual pero
                  sigue fuera del ranking.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </details>
    </Card>
  );
}
