import type { ReactNode } from "react";
import { CourtLines } from "@/components/court-lines";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Líneas de cancha de fondo. Apagalas si la página ya muestra una cancha. */
  decoration?: boolean;
  children?: ReactNode;
};

/** Encabezado oscuro de las páginas internas. */
export function PageHeader({
  eyebrow,
  title,
  description,
  decoration = true,
  children,
}: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden bg-noche-950 text-white">
      {decoration && (
        <CourtLines className="pointer-events-none absolute top-1/2 -right-40 hidden h-[160%] w-[60%] -translate-y-1/2 text-white/[0.05] md:block" />
      )}
      <Container className="relative py-14 sm:py-20">
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

/** Versión de carga del encabezado, para los loading.tsx. */
export function PageHeaderSkeleton({ withControls = false }) {
  return (
    <section className="bg-noche-950">
      <Container className="py-14 sm:py-20">
        <Skeleton className="h-3 w-32 bg-white/10" />
        <Skeleton className="mt-4 h-12 w-2/3 max-w-sm bg-white/10 sm:h-16" />
        <Skeleton className="mt-5 h-5 w-full max-w-xl bg-white/10" />
        {withControls && (
          <Skeleton className="mt-8 h-10 w-64 rounded-full bg-white/10" />
        )}
      </Container>
    </section>
  );
}
