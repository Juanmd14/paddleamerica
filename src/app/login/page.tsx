import type { Metadata } from "next";
import { signIn, signUp } from "@/app/auth/actions";
import { SupabaseNotice } from "@/components/supabase-notice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Input, Label } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { firstParam, safeRedirectPath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ingresar",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const error = firstParam(params.error);
  const message = firstParam(params.message);
  const next = safeRedirectPath(firstParam(params.next));

  return (
    <Container className="max-w-4xl py-12 sm:py-16">
      <h1 className="font-display text-5xl leading-none font-bold uppercase">
        Tu cuenta
      </h1>
      <p className="mt-3 text-muted-foreground">
        Ingresá o creá tu cuenta para anotarte en torneos.
      </p>

      <div className="mt-8 space-y-4">
        {!isSupabaseConfigured && <SupabaseNotice />}
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-lg bg-pista-50 px-4 py-3 text-sm text-pista-800">
            {message}
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <form action={signIn} className="space-y-4">
            <h2 className="font-display text-2xl font-bold uppercase">
              Ingresar
            </h2>
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
              <Label htmlFor="login-password">Contraseña</Label>
              <Input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" variant="secondary" className="w-full">
              Ingresar
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <form action={signUp} className="space-y-4">
            <h2 className="font-display text-2xl font-bold uppercase">
              Crear cuenta
            </h2>
            <div>
              <Label htmlFor="signup-name">Nombre y apellido</Label>
              <Input
                id="signup-name"
                name="full_name"
                autoComplete="name"
                required
              />
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
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Crear cuenta
            </Button>
          </form>
        </Card>
      </div>
    </Container>
  );
}
