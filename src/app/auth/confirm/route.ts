import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";

/**
 * Destino de los links de email de Supabase (confirmación de cuenta,
 * magic link, recuperar contraseña). Soporta `?code=` (PKCE) y `?token_hash=`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Sin next (por ejemplo, si Supabase usó la Site URL), a donde corresponde.
  const next = safeRedirectPath(
    searchParams.get("next"),
    type === "recovery" ? "/mi-cuenta/contrasena" : "/mi-cuenta",
  );

  const supabase = await createClient();
  let verified = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    verified = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    verified = !error;
  }

  if (verified) {
    return NextResponse.redirect(new URL(next, origin));
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "El link expiró o no es válido.");
  return NextResponse.redirect(loginUrl);
}
