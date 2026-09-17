import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn, signUp } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth-shell";
import { SubmitButton } from "@/components/submit-button";
import { Alert } from "@/components/ui/alert";
import { GenderChoice } from "@/components/gender-choice";
import { Input, Label } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn, firstParam, safeRedirectPath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ingresar",
  description: "Ingresá o creá tu cuenta para anotarte en los torneos.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const error = firstParam(params.error);
  const message = firstParam(params.message);
  const next = safeRedirectPath(firstParam(params.next));
  const isSignUp = firstParam(params.modo) === "registro";

  if (await getCurrentUser()) redirect(next);

  const tabHref = (signUpTab: boolean) => {
    const query = new URLSearchParams({ next });
    if (signUpTab) query.set("modo", "registro");
    return `/login?${query}`;
  };

  return (
    <AuthShell
      title={isSignUp ? "Creá tu cuenta" : "Ingresá a tu cuenta"}
      description={
        isSignUp
          ? "Es gratis. Con tu cuenta te anotás en los torneos y seguís tus inscripciones."
          : "Anotate en los torneos y seguí tus inscripciones."
      }
      showSetupNotice={!isSupabaseConfigured}
    >
      <nav
        aria-label="Tipo de acceso"
        className="grid grid-cols-2 rounded-full bg-muted p-1"
      >
        {[false, true].map((signUpTab) => {
          const active = signUpTab === isSignUp;
          return (
            <Link
              key={String(signUpTab)}
              href={tabHref(signUpTab)}
              aria-current={active ? "page" : undefined}
              replace
              scroll={false}
              className={cn(
                "rounded-full py-2 text-center text-sm font-semibold transition-colors",
                active
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {signUpTab ? "Crear cuenta" : "Ingresar"}
            </Link>
          );
        })}
      </nav>

      {(error || message) && (
        <div className="mt-6 space-y-3">
          {error && <Alert tone="danger">{error}</Alert>}
          {message && <Alert tone="info">{message}</Alert>}
        </div>
      )}

      {isSignUp ? (
        <form action={signUp} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <Label htmlFor="signup-name">Nombre y apellido</Label>
            <Input
              id="signup-name"
              name="full_name"
              autoComplete="name"
              minLength={3}
              required
            />
          </div>
          <div>
            <GenderChoice required describedBy="signup-gender-hint" />
            <p
              id="signup-gender-hint"
              className="mt-1.5 text-xs text-muted-foreground"
            >
              Define en qué torneos podés anotarte (masculinos, femeninos o
              mixtos). Después solo la cambia el organizador.
            </p>
          </div>
          <div>
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <Label htmlFor="signup-password">Contraseña</Label>
            <Input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              aria-describedby="signup-password-hint"
              required
            />
            <p
              id="signup-password-hint"
              className="mt-1.5 text-xs text-muted-foreground"
            >
              Mínimo 6 caracteres.
            </p>
          </div>
          <SubmitButton
            size="lg"
            className="w-full"
            pendingLabel="Creando cuenta…"
          >
            Crear cuenta
          </SubmitButton>
        </form>
      ) : (
        <form action={signIn} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <Label htmlFor="login-password">Contraseña</Label>
              <Link
                href="/login/recuperar"
                className="text-xs font-semibold text-accent hover:text-accent-hover"
              >
                ¿Te la olvidaste?
              </Link>
            </div>
            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <SubmitButton
            size="lg"
            variant="secondary"
            className="w-full"
            pendingLabel="Ingresando…"
          >
            Ingresar
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
