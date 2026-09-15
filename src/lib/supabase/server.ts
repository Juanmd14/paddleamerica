import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import { getSupabaseEnv } from "./env";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Creá uno nuevo en cada request; nunca lo compartas entre requests.
 */
export async function createClient() {
  const { url, key } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Llamado desde un Server Component, donde no se pueden escribir cookies.
          // No pasa nada: src/proxy.ts refresca la sesión en cada request.
        }
      },
    },
  });
}
