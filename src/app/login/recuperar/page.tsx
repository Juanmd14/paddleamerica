import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth-shell";
import { SubmitButton } from "@/components/submit-button";
import { Alert } from "@/components/ui/alert";
import { Input, Label } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { firstParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
};

export default async function RecoverPasswordPage({
  searchParams,
}: PageProps<"/login/recuperar">) {
  const params = await searchParams;
  const error = firstParam(params.error);
  const message = firstParam(params.message);

  return (
    <AuthShell
      title="Recuperar contraseña"
      description="Te mandamos un link por email para que elijas una nueva."
      showSetupNotice={!isSupabaseConfigured}
    >
      {(error || message) && (
        <div className="mb-6">
          {error && <Alert tone="danger">{error}</Alert>}
          {message && <Alert tone="success">{message}</Alert>}
        </div>
      )}

      <form action={requestPasswordReset} className="space-y-4">
        <div>
          <Label htmlFor="recover-email">Email de tu cuenta</Label>
          <Input
            id="recover-email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <SubmitButton size="lg" className="w-full" pendingLabel="Enviando…">
          Enviar link
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Te acordaste?{" "}
        <Link
          href="/login"
          className="font-semibold text-accent hover:text-accent-hover"
        >
          Volver a ingresar
        </Link>
      </p>
    </AuthShell>
  );
}
