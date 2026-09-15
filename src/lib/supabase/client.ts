import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { getSupabaseEnv } from "./env";

/** Cliente de Supabase para Client Components ("use client"). */
export function createClient() {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient<Database>(url, key);
}
