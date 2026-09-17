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
  if (typeof value !== "string") return fallback;
  // "//otro.com" y "/\otro.com" los navegadores los toman como otro dominio.
  const external =
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    [...value].some((char) => char.charCodeAt(0) < 32);
  return external ? fallback : value;
}

/** Separa un texto en párrafos (líneas en blanco). */
export function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** "Copa Ciudad de Trenque Lauquen 2026" → "copa-ciudad-de-trenque-lauquen-2026". */
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Link de WhatsApp para un teléfono argentino cargado a mano
 * ("2392 123456", "02392-123456", "+54 9 2392 123456").
 */
export function whatsappUrl(phone: string, message?: string) {
  let digits = phone.replace(/\D/g, "").replace(/^00/, "");
  if (!digits.startsWith("54")) digits = `549${digits.replace(/^0/, "")}`;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}
