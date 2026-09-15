import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: { theme: { radius: ["card"] } },
});

/** Combina clases condicionales y resuelve conflictos de Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Toma el primer valor de un search param (que puede venir repetido). */
export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Evita open redirects: solo acepta rutas internas ("/algo", no "//otro-sitio.com"). */
export function safeRedirectPath(
  value: unknown,
  fallback = "/mi-cuenta",
): string {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
    ? value
    : fallback;
}

/** Separa un texto en párrafos (líneas en blanco). */
export function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
