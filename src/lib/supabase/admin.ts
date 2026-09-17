import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type AccountEmail = {
  id: string;
  email: string;
  full_name: string | null;
};

/**
 * Emails de otras cuentas, para mandarles avisos (una invitación, una respuesta).
 * Usa SUPABASE_SECRET_KEY, que saltea RLS: por eso solo existe esta función,
 * solo en el servidor. Sin la clave devuelve [] y nunca tira error.
 */
export async function getAccountEmails(ids: string[]): Promise<AccountEmail[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  const unique = [...new Set(ids.filter(Boolean))];
  if (!url || !key || unique.length === 0) return [];

  try {
    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", unique);
    if (error) {
      console.error("[emails de cuentas]", error);
      return [];
    }
    return data.filter(
      (row): row is AccountEmail => typeof row.email === "string",
    );
  } catch (error) {
    console.error("[emails de cuentas]", error);
    return [];
  }
}
