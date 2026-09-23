import { Building2, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { NavLink } from "@/components/nav-link";
import { NotificationsButton } from "@/components/notifications-button";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getCurrentUser } from "@/lib/auth";
import { getUnreadNotificationsCount } from "@/lib/data";
import { mainNav, siteConfig } from "@/lib/site";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const unread = user ? await getUnreadNotificationsCount() : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-noche-950/95 text-white backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label={`${siteConfig.name}, inicio`}>
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

        {user ? (
          <div className="flex items-center gap-1">
            {user.isAdmin && (
              <Link
                href="/admin"
                aria-label="Panel de administración"
                className="flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-noche-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <LayoutDashboard className="size-5" aria-hidden="true" />
                <span className="hidden lg:inline">Admin</span>
              </Link>
            )}
            {user.clubIds.length > 0 && (
              <Link
                href="/mi-club"
                aria-label="Mi club"
                className="flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-noche-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Building2 className="size-5" aria-hidden="true" />
                <span className="hidden lg:inline">Mi club</span>
              </Link>
            )}
            <NotificationsButton count={unread} />
            <Link
              href="/mi-cuenta"
              aria-label="Mi cuenta"
              className="flex items-center gap-2.5 rounded-full py-1 pr-1 pl-3 text-sm font-medium text-noche-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              <span className="hidden sm:inline">Mi cuenta</span>
              <Avatar
                name={user.name}
                src={user.avatarUrl}
                size="sm"
                className="bg-noche-800"
              />
            </Link>
          </div>
        ) : (
          <ButtonLink href="/login" size="sm">
            Ingresar
          </ButtonLink>
        )}
      </Container>
    </header>
  );
}
