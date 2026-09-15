import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { SupabaseNotice } from "@/components/supabase-notice";
import { Avatar } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mi cuenta",
};

export default async function AccountPage() {
  if (!isSupabaseConfigured) {
    return (
      <Container className="max-w-3xl py-12 sm:py-16">
        <SupabaseNotice />
      </Container>
    );
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const claims = auth?.claims;

  // El proxy ya protege esta ruta, pero siempre verificá en el servidor también.
  if (!claims) redirect("/login?next=/mi-cuenta");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", claims.sub)
    .maybeSingle();

  const name = profile?.full_name || claims.email || "Jugador";

  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar name={name} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-4xl leading-none font-bold uppercase">
              Hola, {name}
            </h1>
            <p className="mt-2 truncate text-muted-foreground">
              {claims.email}
            </p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </Card>

      <div className="mt-8 rounded-card border border-dashed border-noche-200 p-8 text-center">
        <p className="font-semibold">Pronto vas a poder hacer más desde acá</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Seguir jugadores, anotarte en torneos y ver tus resultados.
        </p>
        <ButtonLink href="/torneos" className="mt-6">
          Ver torneos
        </ButtonLink>
      </div>
    </Container>
  );
}
