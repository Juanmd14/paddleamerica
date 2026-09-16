/** Helpers para las Server Actions del panel: leer y validar campos de formularios. */

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

/** Texto opcional: vacío → null. */
export function optionalText(formData: FormData, name: string) {
  return text(formData, name) || null;
}

/** Entero ≥ 0. Vacío → fallback. NaN si no es un número válido. */
export function wholeNumber(formData: FormData, name: string, fallback = 0) {
  const value = text(formData, name);
  if (value === "") return fallback;
  return /^\d+$/.test(value) ? Number(value) : Number.NaN;
}

export function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** URL de imagen subida a Storage (o vacía). Evita que se guarden URLs arbitrarias. */
export function isStorageUrl(value: string | null) {
  if (!value) return true;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(base && value.startsWith(`${base}/storage/v1/object/public/`));
}

/** Mensaje para errores de Postgres comunes al guardar. */
export function saveErrorMessage(error: { code?: string; message?: string }) {
  if (error.code === "23505") return "Ya existe otro registro con ese slug.";
  if (error.code === "23514")
    return "Hay un dato que no cumple las reglas (revisá números y fechas).";
  if (error.code === "42501") return "No tenés permiso para hacer esto.";
  return "No pudimos guardar los cambios. Probá de nuevo.";
}
