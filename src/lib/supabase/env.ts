// Acceso directo a process.env.NEXT_PUBLIC_* para que Next.js lo inyecte en el bundle del cliente.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && key);

export function getSupabaseEnv() {
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local",
    );
  }
  return { url, key };
}
