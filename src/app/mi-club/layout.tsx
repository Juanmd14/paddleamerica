import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { NavLink } from "@/components/nav-link";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: { default: "Mi club", template: "%s · Mi club" },
  robots: { index: false },
};

const sections = [
  { href: "/mi-club", label: "Torneos", exact: true },
  { href: "/mi-club/fotos", label: "Álbum" },
];

/**
 * Solo el marco visual. El permiso se verifica en cada página y cada Server
 * Action con requireClubOwner(): el layout no se vuelve a ejecutar al navegar.
 */
export default function ClubPanelLayout({ children }: LayoutProps<"/mi-club">) {
  return (
    <div className="flex flex-1 flex-col bg-muted/50">
      <div className="border-b border-border bg-surface">
        <Container className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <p className="hidden font-display text-xl font-bold uppercase sm:block">
              Mi club
            </p>
            <nav aria-label="Mi club" className="flex gap-1">
              {sections.map((section) => (
                <NavLink
                  key={section.href}
                  href={section.href}
                  exact={section.exact}
                  className="relative px-3 py-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  activeClassName="text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                >
                  {section.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <Link
            href="/clubes"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
          >
            Ver clubes
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
        </Container>
      </div>
      <Container className="flex-1 py-8 sm:py-10">{children}</Container>
    </div>
  );
}
