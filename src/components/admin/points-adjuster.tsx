"use client";

import { Minus, Plus } from "lucide-react";
import { useActionState, useState } from "react";
import type { AdjustPointsState } from "@/app/admin/jugadores/actions";
import { Field, Table, Td, Th } from "@/components/admin/admin-ui";
import { SubmitButton } from "@/components/submit-button";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PlayerPointChange } from "@/types/models";

type PointsAdjusterProps = {
  action: (
    state: AdjustPointsState,
    formData: FormData,
  ) => Promise<AdjustPointsState>;
  points: number;
  history: PlayerPointChange[];
};

/** Corrige los puntos de un jugador con un motivo y muestra el historial. */
export function PointsAdjuster({
  action,
  points,
  history,
}: PointsAdjusterProps) {
  const [state, formAction] = useActionState(action, {});
  const [direction, setDirection] = useState<"sumar" | "restar">("sumar");
  const [amount, setAmount] = useState("");
  // Después de aplicar una corrección, el campo de puntos vuelve a vacío.
  const [lastSaved, setLastSaved] = useState(state.savedAt);
  if (state.savedAt !== lastSaved) {
    setLastSaved(state.savedAt);
    setAmount("");
  }
  const value = /^\d+$/.test(amount) ? Number(amount) : 0;
  const result = direction === "sumar" ? points + value : points - value;

  return (
    <Card className="space-y-5 p-5 sm:p-6">
      <div>
        <h2 className="font-display text-2xl font-bold uppercase">
          Corregir puntos
        </h2>
        <p className="text-sm text-muted-foreground">
          Si hubo un error, sumá o restá puntos con un motivo. Queda en el
          historial y se ve en el ranking al instante.
        </p>
      </div>

      {state.message && <Alert tone="danger">{state.message}</Alert>}
      {state.total !== undefined && (
        <Alert tone="success">
          Listo: ahora tiene {formatNumber(state.total)} puntos.
        </Alert>
      )}

      <form
        action={formAction}
        className="grid gap-4 sm:grid-cols-[auto_8rem_1fr_auto] sm:items-end"
      >
        <input type="hidden" name="direction" value={direction} />
        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground-soft">
            Qué hacer
          </p>
          <div className="inline-flex rounded-lg border border-border-strong p-1">
            {(["sumar", "restar"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={direction === option}
                onClick={() => setDirection(option)}
                className={cn(
                  "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-colors",
                  direction === option
                    ? option === "sumar"
                      ? "bg-success text-white"
                      : "bg-danger text-white"
                    : "text-foreground-soft hover:bg-muted",
                )}
              >
                {option === "sumar" ? (
                  <Plus className="size-4" aria-hidden="true" />
                ) : (
                  <Minus className="size-4" aria-hidden="true" />
                )}
                {option === "sumar" ? "Sumar" : "Restar"}
              </button>
            ))}
          </div>
        </div>
        <Field name="amount" label="Puntos" error={state.errors?.amount}>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            onWheel={(event) => event.currentTarget.blur()}
            aria-invalid={state.errors?.amount ? true : undefined}
            required
          />
        </Field>
        <Field name="reason" label="Motivo" error={state.errors?.reason}>
          <Input
            id="reason"
            name="reason"
            maxLength={150}
            placeholder="Ej. Error en la carga del Abierto de Primavera"
            aria-invalid={state.errors?.reason ? true : undefined}
            required
          />
        </Field>
        <SubmitButton pendingLabel="Guardando…">Aplicar</SubmitButton>
      </form>
      <p className="-mt-2 text-sm text-muted-foreground" aria-live="polite">
        {value > 0
          ? `${formatNumber(points)} → ${formatNumber(result)} puntos.`
          : `Hoy tiene ${formatNumber(points)} puntos.`}
        {result < 0 && value > 0 && " No puede quedar en negativo."}
      </p>

      <div>
        <h3 className="text-sm font-semibold">Historial</h3>
        {history.length > 0 ? (
          <div className="mt-2 overflow-hidden rounded-lg border border-border">
            <Table>
              <thead>
                <tr>
                  <Th>Fecha</Th>
                  <Th className="text-right">Cambio</Th>
                  <Th className="text-right">Total</Th>
                  <Th>Motivo</Th>
                </tr>
              </thead>
              <tbody>
                {history.map((change) => (
                  <tr key={change.id}>
                    <Td className="whitespace-nowrap text-foreground-soft">
                      {formatDate(change.created_at)}
                    </Td>
                    <Td
                      className={cn(
                        "text-right font-semibold tabular-nums",
                        change.delta > 0 ? "text-success" : "text-danger",
                      )}
                    >
                      {change.delta > 0 ? "+" : "−"}
                      {formatNumber(Math.abs(change.delta))}
                    </Td>
                    <Td className="text-right tabular-nums">
                      {formatNumber(change.points_after)}
                    </Td>
                    <Td className="text-foreground-soft">{change.reason}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            Todavía no hubo cambios de puntos desde que se guarda el historial.
          </p>
        )}
      </div>
    </Card>
  );
}
