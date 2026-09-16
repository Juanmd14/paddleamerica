"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  /** Marcar activa solo en la ruta exacta (no en sus subrutas). */
  exact?: boolean;
};

/** Link de navegación que se marca cuando estás en esa sección. */
export function NavLink({
  href,
  children,
  className,
  activeClassName,
  exact = false,
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (!exact && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(className, isActive && activeClassName)}
    >
      {children}
    </Link>
  );
}
