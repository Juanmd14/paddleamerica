import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
};

/** Encabezado oscuro de las páginas internas. */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: PageHeaderProps) {
  return (
    <section className="bg-noche-950 text-white">
      <Container className="py-14 sm:py-20">
        {eyebrow && (
          <p className="text-xs font-semibold tracking-[0.25em] text-oro-400 uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-3 font-display text-5xl leading-none font-bold uppercase sm:text-7xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-lg text-noche-300">{description}</p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </Container>
    </section>
  );
}
