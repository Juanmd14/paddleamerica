import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { isStorageUrl } from "@/lib/admin-form";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  /** Usuario público, sin @. */
  username: string | null;
  /** Foto de perfil (solo si está subida a nuestro Storage). */
  avatarUrl: string | null;
  isAdmin: boolean;
};

/**
 * Usuario logueado (o null). Valida el JWT con getClaims() y se memoiza por request,
 * así el header y la página pueden pedirlo sin repetir la verificación.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, username, avatar_url")
    .eq("id", claims.sub)
    .maybeSingle();

  const email = claims.email ?? "";
  const fullName = claims.user_metadata?.full_name;

  return {
    id: claims.sub,
    email,
    name: typeof fullName === "string" && fullName ? fullName : email,
    username: profile?.username ?? null,
    avatarUrl: safeAvatarUrl(profile?.avatar_url),
    isAdmin: profile?.is_admin ?? false,
  };
});

/** La foto solo se muestra si está en nuestro Storage (next/image rechaza otros dominios). */
export function safeAvatarUrl(url: string | null | undefined) {
  return url && isStorageUrl(url) ? url : null;
}

/**
 * Para páginas y Server Actions del panel. Sin sesión manda al login;
 * logueado pero sin permiso responde 404 (no revela que el panel existe).
 * Llamala en cada página y cada acción: el layout no alcanza.
 */
export async function requireAdmin(next = "/admin"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!user.isAdmin) notFound();
  return user;
}
