import Link from "next/link";
import { Logo } from "@/components/logo";
import { NavLink } from "@/components/nav-link";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { mainNav } from "@/lib/site";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

async function isLoggedIn() {
  if (!isSupabaseConfigured) return false;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return Boolean(data?.claims);
}

export async function SiteHeader() {
  const loggedIn = await isLoggedIn();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-noche-950/95 text-white backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/">
          <Logo />
        </Link>

        <nav
          aria-label="Principal"
          className="hidden items-center gap-1 md:flex"
        >
          {mainNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-noche-300 transition-colors hover:text-white"
              activeClassName="bg-white/10 text-white"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <ButtonLink
          href={loggedIn ? "/mi-cuenta" : "/login"}
          variant={loggedIn ? "inverse" : "primary"}
          size="sm"
        >
          {loggedIn ? "Mi cuenta" : "Ingresar"}
        </ButtonLink>
      </Container>

      <nav
        aria-label="Secciones"
        className="border-t border-white/10 md:hidden"
      >
        <Container className="flex gap-1 overflow-x-auto py-2">
          {mainNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap text-noche-300"
              activeClassName="bg-white/10 text-white"
            >
              {item.label}
            </NavLink>
          ))}
        </Container>
      </nav>
    </header>
  );
}
