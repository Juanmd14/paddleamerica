import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { NavLink } from "@/components/nav-link";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel" },
  robots: { index: false },
};

const sections = [
  { href: "/admin", label: "Resumen", exact: true },
  { href: "/admin/torneos", label: "Torneos" },
  { href: "/admin/noticias", label: "Noticias" },
  { href: "/admin/jugadores", label: "Jugadores" },
  { href: "/admin/puntos", label: "Carga de puntos" },
  { href: "/admin/sitio", label: "Sitio" },
];

/**
 * Solo el marco visual. El permiso de admin se verifica en cada página y
 * cada Server Action con requireAdmin(): el layout no se vuelve a ejecutar al navegar.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col bg-muted/50">
      <div className="border-b border-border bg-surface">
        <Container className="flex items-center gap-6">
          <p className="hidden shrink-0 font-display text-xl font-bold uppercase sm:block">
            Panel
          </p>
          <nav
            aria-label="Panel de administración"
            className="-mx-4 scrollbar-none flex flex-1 gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0"
          >
            {sections.map((section) => (
              <NavLink
                key={section.href}
                href={section.href}
                exact={section.exact}
                className="relative shrink-0 px-3 py-4 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
                activeClassName="text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
              >
                {section.label}
              </NavLink>
            ))}
          </nav>
          <Link
            href="/"
            className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover md:inline-flex"
          >
            Ver sitio
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
        </Container>
      </div>
      <Container className="flex-1 py-8 sm:py-10">{children}</Container>
    </div>
  );
}
