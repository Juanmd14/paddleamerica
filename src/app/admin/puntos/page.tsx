import { Download, RotateCcw } from "lucide-react";
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
  { href: "/admin/puntos/planilla?rama=masculino", label: "Masculino" },
  { href: "/admin/puntos/planilla?rama=femenino", label: "Femenino" },
  { href: "/admin/puntos/planilla", label: "Todos" },
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
        description="Actualizá el ranking de una vez subiendo un Excel. Antes de aplicar ves exactamente qué cambia."
      />
      {params.deshecha && (
        <Alert tone="success">
          Deshicimos la última carga: los puntos volvieron a como estaban.
        </Alert>
      )}
      {error && <Alert tone="danger">{error}</Alert>}

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
              Planilla modelo
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Bajala con los jugadores actuales, cambiá los puntos y volvé a
              subirla. La columna <strong>Código</strong> identifica a cada
              jugador sin errores; para jugadores nuevos dejala vacía.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {templates.map((template) => (
                <a
                  key={template.href}
                  href={template.href}
                  className={buttonStyles({ variant: "outline", size: "sm" })}
                >
                  <Download className="size-4" aria-hidden="true" />
                  {template.label}
                </a>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              También sirve cualquier Excel o CSV con columnas como Jugador (o
              Nombre y Apellido), Rama, Categoría y Puntos.
            </p>
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
