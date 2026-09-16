"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  LoaderCircle,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  type ApplyRow,
  applyPointsImport,
  type PlayerOption,
  type PreviewRow,
  previewPointsImport,
} from "@/app/admin/puntos/actions";
import { Table, Td, Th } from "@/components/admin/admin-ui";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select } from "@/components/ui/input";
import { formatNumber } from "@/lib/format";
import { playerGenderOptions } from "@/lib/labels";
import {
  applyMapping,
  COLUMN_FIELDS,
  type ColumnKey,
  type ColumnMapping,
  detectColumns,
  type ImportMode,
  parseCsv,
  splitSheet,
} from "@/lib/points-import";
import { cn } from "@/lib/utils";

type Decision =
  | { action: "player"; playerId: number }
  | { action: "create" }
  | { action: "skip" };

type PointsImporterProps = {
  tournamentNames: string[];
  categories: string[];
};

function cellToText(value: unknown) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

async function readFile(file: File): Promise<string[][]> {
  if (/\.csv$/i.test(file.name) || file.type === "text/csv") {
    return parseCsv(await file.text());
  }
  const { readSheet } = await import("read-excel-file/browser");
  const rows = await readSheet(file);
  return rows.map((row) => row.map(cellToText));
}

export function PointsImporter({
  tournamentNames,
  categories,
}: PointsImporterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [fileName, setFileName] = useState("");
  const [sheet, setSheet] = useState<ReturnType<typeof splitSheet> | null>(
    null,
  );
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [mode, setMode] = useState<ImportMode>("reemplazar");
  const [label, setLabel] = useState("");
  const [defaultGender, setDefaultGender] = useState("masculino");
  const [defaultCategory, setDefaultCategory] = useState(categories[0] ?? "");

  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [decisions, setDecisions] = useState<Record<number, Decision>>({});
  const [error, setError] = useState("");
  /** Filas listas para aplicar, mientras el admin revisa el resumen. */
  const [confirmRows, setConfirmRows] = useState<ApplyRow[] | null>(null);
  const [result, setResult] = useState<{
    updated: number;
    created: number;
  } | null>(null);

  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );

  function reset() {
    setPreview(null);
    setDecisions({});
    setError("");
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    reset();
    setResult(null);
    try {
      const parsed = splitSheet(await readFile(file));
      if (parsed.header.length === 0 || parsed.body.length === 0) {
        setError(
          "El archivo está vacío o no tiene filas debajo del encabezado.",
        );
        return;
      }
      setFileName(file.name);
      setSheet(parsed);
      setMapping(detectColumns(parsed.header));
    } catch (readError) {
      console.error(readError);
      setError(
        "No pudimos leer el archivo. Tiene que ser un Excel (.xlsx) o un CSV.",
      );
    }
  }

  function handlePreview() {
    if (!sheet || !mapping) return;
    if (mapping.points === null) {
      setError("Elegí qué columna tiene los puntos.");
      return;
    }
    if (
      mapping.code === null &&
      mapping.fullName === null &&
      mapping.lastName === null
    ) {
      setError("Elegí la columna del código o la del nombre del jugador.");
      return;
    }
    setError("");
    startTransition(async () => {
      const response = await previewPointsImport(
        applyMapping(sheet.body, mapping),
        mode,
      );
      if ("message" in response) {
        setError(response.message);
        return;
      }
      setPlayers(response.players);
      setPreview(response.rows);
      setDecisions(
        Object.fromEntries(
          response.rows.map((row): [number, Decision] => [
            row.line,
            row.error
              ? { action: "skip" }
              : row.match === "exact" && row.playerId !== null
                ? { action: "player", playerId: row.playerId }
                : row.match === "none"
                  ? { action: "create" }
                  : { action: "skip" },
          ]),
        ),
      );
    });
  }

  const summary = useMemo(() => {
    const counts = { update: 0, create: 0, skip: 0, errors: 0, review: 0 };
    for (const row of preview ?? []) {
      const decision = decisions[row.line];
      if (row.error) counts.errors++;
      else if (decision?.action === "player") counts.update++;
      else if (decision?.action === "create") counts.create++;
      else counts.skip++;
      if (
        !row.error &&
        row.match === "ambiguous" &&
        decision?.action === "skip"
      ) {
        counts.review++;
      }
    }
    return counts;
  }, [preview, decisions]);

  function handleApply() {
    if (!preview) return;
    const chosen = new Set<number>();
    const rows: ApplyRow[] = [];

    for (const row of preview) {
      const decision = decisions[row.line];
      if (row.error || !decision || decision.action === "skip") continue;
      if (decision.action === "player") {
        if (chosen.has(decision.playerId)) {
          setError(
            `Fila ${row.line}: ese jugador ya está elegido en otra fila.`,
          );
          return;
        }
        chosen.add(decision.playerId);
      }
      rows.push({
        line: row.line,
        playerId: decision.action === "player" ? decision.playerId : null,
        firstName: row.firstName,
        lastName: row.lastName,
        gender: row.gender ?? defaultGender,
        category: row.category || defaultCategory,
        club: row.club,
        city: row.city,
        points: row.points,
        matchesPlayed: row.matchesPlayed,
        matchesWon: row.matchesWon,
        titles: row.titles,
      });
    }

    if (rows.length === 0) {
      setError("No hay filas para aplicar.");
      return;
    }
    setError("");
    setConfirmRows(rows);
  }

  /** Cuántos puntos gana o pierde cada jugador con la carga, de mayor a menor. */
  const changes = useMemo(
    () =>
      (confirmRows ?? [])
        .map((row) => {
          const player =
            row.playerId !== null ? playersById.get(row.playerId) : undefined;
          const before = player?.points ?? 0;
          const after = mode === "sumar" ? before + row.points : row.points;
          return {
            line: row.line,
            name: player?.name ?? `${row.firstName} ${row.lastName}`.trim(),
            isNew: !player,
            before,
            change: after - before,
            after,
          };
        })
        .toSorted(
          (a, b) => b.change - a.change || a.name.localeCompare(b.name, "es"),
        ),
    [confirmRows, playersById, mode],
  );
  const totalChange = changes.reduce((total, item) => total + item.change, 0);

  function confirmApply() {
    if (!confirmRows) return;
    const rows = confirmRows;
    startTransition(async () => {
      const response = await applyPointsImport({ fileName, mode, label, rows });
      setConfirmRows(null);
      if (!response.ok) {
        setError(response.message);
        return;
      }
      setResult({ updated: response.updated, created: response.created });
      setSheet(null);
      setMapping(null);
      setFileName("");
      setLabel("");
      reset();
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {result && (
        <Alert tone="success">
          Listo: se actualizaron {result.updated} jugadores
          {result.created > 0 && ` y se crearon ${result.created}`}. Si algo
          quedó mal, podés deshacer la carga.
        </Alert>
      )}
      {error && <Alert tone="danger">{error}</Alert>}

      <Card className="p-5 sm:p-6">
        <h2 className="font-display text-2xl font-bold uppercase">
          1. Subí el archivo
        </h2>
        <label
          htmlFor="points-file"
          className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-border-strong bg-surface p-8 text-center transition-colors hover:border-pista-400 hover:bg-pista-50"
        >
          <Upload className="size-7 text-accent" aria-hidden="true" />
          <span className="font-semibold">
            {fileName ? `Archivo: ${fileName}` : "Elegí un Excel (.xlsx) o CSV"}
          </span>
          <span className="text-xs text-muted-foreground">
            Lo leemos en tu navegador; no se guarda el archivo.
          </span>
        </label>
        <input
          id="points-file"
          type="file"
          accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          className="sr-only"
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </Card>

      {sheet && mapping && (
        <Card className="space-y-6 p-5 sm:p-6">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase">
              2. Revisá las columnas
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Las detectamos por el encabezado. Corregí las que no estén bien.{" "}
              {sheet.body.length} filas con datos.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COLUMN_FIELDS.map(({ key, label: fieldLabel }) => (
              <div key={key}>
                <Label htmlFor={`column-${key}`}>
                  {fieldLabel}
                  {key === "points" && <span className="text-danger"> *</span>}
                </Label>
                <Select
                  id={`column-${key}`}
                  value={mapping[key] ?? ""}
                  onChange={(event) => {
                    reset();
                    setMapping({
                      ...mapping,
                      [key as ColumnKey]:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    });
                  }}
                >
                  <option value="">—</option>
                  {sheet.header.map((title, index) => (
                    <option key={index} value={index}>
                      {title || `Columna ${index + 1}`}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-foreground-soft">
              ¿Qué traen los puntos?
            </legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    value: "reemplazar",
                    title: "El total acumulado",
                    text: "Reemplaza los puntos de cada jugador por los del archivo (y PJ, PG y títulos si vienen).",
                  },
                  {
                    value: "sumar",
                    title: "Los puntos de un torneo",
                    text: "Suma los puntos del archivo a los que ya tiene cada jugador (y PJ, PG y títulos si vienen).",
                  },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-lg border p-4",
                    mode === option.value
                      ? "border-noche-950 bg-muted"
                      : "border-border-strong hover:border-noche-400",
                  )}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={option.value}
                    checked={mode === option.value}
                    onChange={() => {
                      reset();
                      setMode(option.value);
                    }}
                    className="mt-1 accent-noche-950"
                  />
                  <span>
                    <span className="block font-semibold">{option.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {option.text}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="import-label">
                Nombre de la carga{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </Label>
              <Input
                id="import-label"
                list="tournament-names"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder={
                  mode === "sumar"
                    ? "Ej. Abierto de Primavera"
                    : "Ej. Ranking septiembre"
                }
              />
              <datalist id="tournament-names">
                {tournamentNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="default-gender">Rama para jugadores nuevos</Label>
              <Select
                id="default-gender"
                value={defaultGender}
                onChange={(event) => setDefaultGender(event.target.value)}
              >
                {playerGenderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="default-category">
                Categoría para jugadores nuevos
              </Label>
              <Input
                id="default-category"
                list="category-options"
                value={defaultCategory}
                onChange={(event) => setDefaultCategory(event.target.value)}
                placeholder="Ej. 3ra"
              />
              <datalist id="category-options">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            La rama y la categoría del archivo tienen prioridad; estas se usan
            solo si faltan.
          </p>

          <Button onClick={handlePreview} disabled={isPending}>
            {isPending && !preview ? (
              <LoaderCircle
                className="size-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : (
              <FileSpreadsheet className="size-4" aria-hidden="true" />
            )}
            Ver vista previa
          </Button>
        </Card>
      )}

      {preview && (
        <Card className="overflow-hidden">
          <div className="space-y-3 p-5 sm:p-6">
            <h2 className="font-display text-2xl font-bold uppercase">
              3. Confirmá los cambios
            </h2>
            <div className="flex flex-wrap gap-2">
              <Badge tone="success">{summary.update} se actualizan</Badge>
              <Badge tone="accent">{summary.create} jugadores nuevos</Badge>
              <Badge>{summary.skip} se ignoran</Badge>
              {summary.errors > 0 && (
                <Badge tone="danger">{summary.errors} con errores</Badge>
              )}
              {summary.review > 0 && (
                <Badge tone="primary">
                  {summary.review} para revisar (nombre repetido)
                </Badge>
              )}
            </div>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Fila</Th>
                <Th>En el archivo</Th>
                <Th>Jugador</Th>
                <Th className="text-right">Puntos</Th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row) => {
                const decision = decisions[row.line] ?? { action: "skip" };
                const player =
                  decision.action === "player"
                    ? playersById.get(decision.playerId)
                    : undefined;
                const current = player?.points ?? 0;
                const next =
                  decision.action === "skip"
                    ? null
                    : mode === "sumar" && player
                      ? current + row.points
                      : row.points;
                const candidates = row.candidates
                  .map((id) => playersById.get(id))
                  .filter((candidate) => !!candidate);

                return (
                  <tr
                    key={row.line}
                    className={cn(row.error && "bg-danger-soft/40")}
                  >
                    <Td className="text-muted-foreground tabular-nums">
                      {row.line}
                    </Td>
                    <Td>
                      <p className="font-medium">{row.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {[row.category, row.club, row.city]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {row.error && (
                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-danger">
                          <AlertTriangle
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          {row.error}
                        </p>
                      )}
                    </Td>
                    <Td className="min-w-56">
                      {row.error ? (
                        <span className="text-sm text-muted-foreground">
                          No se aplica
                        </span>
                      ) : (
                        <Select
                          aria-label={`Jugador para la fila ${row.line}`}
                          value={
                            decision.action === "player"
                              ? String(decision.playerId)
                              : decision.action
                          }
                          onChange={(event) => {
                            const value = event.target.value;
                            setDecisions({
                              ...decisions,
                              [row.line]:
                                value === "create" || value === "skip"
                                  ? { action: value }
                                  : {
                                      action: "player",
                                      playerId: Number(value),
                                    },
                            });
                          }}
                          className={cn(
                            "h-10",
                            row.match === "ambiguous" &&
                              decision.action === "skip" &&
                              "border-oro-500",
                          )}
                        >
                          <option value="skip">Ignorar</option>
                          <option value="create">Crear jugador nuevo</option>
                          {candidates.length > 0 && (
                            <optgroup label="Coincidencias">
                              {candidates.map((candidate) => (
                                <option key={candidate.id} value={candidate.id}>
                                  {candidate.name} · {candidate.category}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          <optgroup label="Todos los jugadores">
                            {players.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name} · {option.category}
                              </option>
                            ))}
                          </optgroup>
                        </Select>
                      )}
                      {!row.error &&
                        row.match === "exact" &&
                        decision.action === "player" && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-success">
                            <CheckCircle2
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            Coincide
                          </p>
                        )}
                    </Td>
                    <Td className="text-right whitespace-nowrap tabular-nums">
                      {next === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <>
                          {player && (
                            <span className="text-muted-foreground">
                              {formatNumber(current)} →{" "}
                            </span>
                          )}
                          <span className="font-display text-xl font-bold">
                            {formatNumber(next)}
                          </span>
                          {player && next !== current && (
                            <span
                              className={cn(
                                "ml-2 text-xs font-semibold",
                                next > current ? "text-success" : "text-danger",
                              )}
                            >
                              {next > current ? "+" : ""}
                              {formatNumber(next - current)}
                            </span>
                          )}
                        </>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
            <p className="text-sm text-muted-foreground">
              Se aplica todo junto: si algo falla, no se modifica ningún
              jugador.
            </p>
            <Button
              onClick={handleApply}
              disabled={isPending || summary.update + summary.create === 0}
            >
              {isPending && (
                <LoaderCircle
                  className="size-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}
              Revisar y aplicar ({summary.update + summary.create})
            </Button>
          </div>
        </Card>
      )}

      <Modal
        open={confirmRows !== null}
        onClose={() => {
          if (!isPending) setConfirmRows(null);
        }}
        title="¿Está bien la carga?"
        description={`${changes.length} ${changes.length === 1 ? "jugador" : "jugadores"} · ${totalChange >= 0 ? "+" : "−"}${formatNumber(Math.abs(totalChange))} puntos en total${label.trim() ? ` · ${label.trim()}` : ""}`}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Se actualiza todo junto. Si algo quedó mal, después podés deshacer
              la carga.
            </p>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmRows(null)}
                disabled={isPending}
              >
                Volver
              </Button>
              <Button onClick={confirmApply} disabled={isPending}>
                {isPending && (
                  <LoaderCircle
                    className="size-4 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                )}
                {isPending ? "Actualizando…" : "Confirmar y actualizar"}
              </Button>
            </div>
          </div>
        }
      >
        <ul className="divide-y divide-border">
          {changes.map((item) => (
            <li
              key={item.line}
              className="flex items-center gap-3 px-5 py-3 sm:px-6"
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2">
                  <span className="truncate font-semibold">{item.name}</span>
                  {item.isNew && <Badge tone="accent">Nuevo</Badge>}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatNumber(item.before)} → {formatNumber(item.after)} pts
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 font-display text-2xl leading-none font-bold tabular-nums",
                  item.change > 0
                    ? "text-success"
                    : item.change < 0
                      ? "text-danger"
                      : "text-muted-foreground",
                )}
              >
                {item.change > 0 ? "+" : item.change < 0 ? "−" : "±"}
                {formatNumber(Math.abs(item.change))}
                <span className="ml-0.5 text-sm">p</span>
              </span>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
