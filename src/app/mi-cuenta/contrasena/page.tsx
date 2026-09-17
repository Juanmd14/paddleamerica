import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { updatePassword } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth-shell";
import { SubmitButton } from "@/components/submit-button";
import { Alert } from "@/components/ui/alert";
import { Input, Label } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { firstParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cambiar contraseña",
  robots: { index: false },
};

export default async function ChangePasswordPage({
  searchParams,
}: PageProps<"/mi-cuenta/contrasena">) {
  // El proxy ya protege /mi-cuenta, pero siempre verificá en el servidor también.
  if (isSupabaseConfigured && !(await getCurrentUser())) {
    redirect("/login?next=/mi-cuenta/contrasena");
  }

  const error = firstParam((await searchParams).error);

  return (
    <AuthShell
      title="Nueva contraseña"
      description="Elegí una contraseña nueva para tu cuenta."
      showSetupNotice={!isSupabaseConfigured}
    >
      {error && (
        <div className="mb-6">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      <form action={updatePassword} className="space-y-4">
        <div>
          <Label htmlFor="new-password">Contraseña nueva</Label>
          <Input
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            aria-describedby="new-password-hint"
            required
          />
          <p
            id="new-password-hint"
            className="mt-1.5 text-xs text-muted-foreground"
          >
            Mínimo 6 caracteres.
          </p>
        </div>
        <div>
          <Label htmlFor="confirm-password">Repetila</Label>
          <Input
            id="confirm-password"
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
        <SubmitButton size="lg" className="w-full" pendingLabel="Guardando…">
          Guardar contraseña
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link
          href="/mi-cuenta?seccion=datos"
          className="font-semibold text-accent hover:text-accent-hover"
        >
          Volver a mi cuenta
        </Link>
      </p>
    </AuthShell>
  );
}
