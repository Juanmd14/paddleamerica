import Link from "next/link";
import { Logo } from "@/components/logo";
import { Container } from "@/components/ui/container";
import { isDemoMode } from "@/lib/data";
import { mainNav, siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-noche-950 text-noche-300">
      <Container className="flex flex-col gap-10 py-12 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <Logo className="text-white" />
          <p className="mt-4 text-sm leading-6">{siteConfig.description}</p>
        </div>
        <nav aria-label="Pie de página" className="flex flex-col gap-2 text-sm">
          <p className="mb-1 text-xs font-semibold tracking-[0.2em] text-white uppercase">
            Secciones
          </p>
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-6 text-xs sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
          {isDemoMode && (
            <p>
              Mostrando datos de ejemplo. Configurá Supabase para usar datos
              reales.
            </p>
          )}
        </Container>
      </div>
    </footer>
  );
}
