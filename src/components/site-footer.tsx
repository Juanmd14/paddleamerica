import { AtSign, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { Container } from "@/components/ui/container";
import { mainNav, siteConfig } from "@/lib/site";

const { whatsapp, instagram, email } = siteConfig.contact;

const contactLinks = [
  whatsapp && {
    href: `https://wa.me/${whatsapp}`,
    label: "WhatsApp",
    icon: MessageCircle,
  },
  instagram && {
    href: `https://instagram.com/${instagram}`,
    label: `@${instagram}`,
    icon: AtSign,
  },
  email && { href: `mailto:${email}`, label: email, icon: Mail },
].filter((link) => !!link);

const linkClass = "transition-colors hover:text-white";

export function SiteFooter() {
  return (
    <footer className="bg-noche-950 text-noche-300">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo className="text-white" />
          <p className="mt-5 text-sm leading-6">{siteConfig.description}</p>
        </div>

        <FooterColumn title="Secciones">
          <Link href="/" className={linkClass}>
            Inicio
          </Link>
          {mainNav.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </Link>
          ))}
        </FooterColumn>

        <FooterColumn title="Tu cuenta">
          <Link href="/login" className={linkClass}>
            Ingresar
          </Link>
          <Link href="/login?modo=registro" className={linkClass}>
            Crear cuenta
          </Link>
          <Link href="/mi-cuenta" className={linkClass}>
            Mis inscripciones
          </Link>
        </FooterColumn>

        {contactLinks.length > 0 && (
          <FooterColumn title="Contacto">
            {contactLinks.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 ${linkClass}`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </a>
            ))}
          </FooterColumn>
        )}
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-1 py-6 text-xs sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
          <p>Pádel de {siteConfig.region}</p>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <nav
      aria-label={title}
      className="flex flex-col items-start gap-2.5 text-sm"
    >
      <p className="mb-1 text-xs font-semibold tracking-[0.2em] text-white uppercase">
        {title}
      </p>
      {children}
    </nav>
  );
}
