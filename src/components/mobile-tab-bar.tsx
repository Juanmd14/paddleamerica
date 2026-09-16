import { House, ListOrdered, Newspaper, Trophy } from "lucide-react";
import { NavLink } from "@/components/nav-link";

const tabs = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/torneos", label: "Torneos", icon: Trophy },
  { href: "/jugadores", label: "Ranking", icon: ListOrdered },
  { href: "/noticias", label: "Noticias", icon: Newspaper },
];

/** Navegación principal en celulares, fija abajo como en una app. */
export function MobileTabBar() {
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {tabs.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <NavLink
              href={href}
              className="flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold text-muted-foreground transition-colors"
              activeClassName="text-accent"
            >
              <Icon className="size-5.5" aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
