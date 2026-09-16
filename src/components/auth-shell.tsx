import type { ReactNode } from "react";
import { CourtLines } from "@/components/court-lines";
import { SupabaseNotice } from "@/components/supabase-notice";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

type AuthShellProps = {
  title: string;
  description?: string;
  /** Muestra el aviso de configuración cuando falta Supabase. */
  showSetupNotice?: boolean;
  children: ReactNode;
};

/** Marco común de las pantallas de cuenta: fondo oscuro y tarjeta centrada. */
export function AuthShell({
  title,
  description,
  showSetupNotice = false,
  children,
}: AuthShellProps) {
  return (
    <div className="relative flex flex-1 overflow-hidden bg-noche-950">
      <CourtLines
        orientation="vertical"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[140%] w-full -translate-x-1/2 -translate-y-1/2 text-white/[0.05]"
      />
      <Container className="relative flex max-w-md flex-col justify-center py-12 sm:py-20">
        <h1 className="text-center font-display text-5xl leading-none font-bold text-white uppercase">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-center text-noche-300">{description}</p>
        )}
        {showSetupNotice && (
          <div className="mt-8">
            <SupabaseNotice />
          </div>
        )}
        {/* Sin Supabase, en producción no tiene sentido mostrar formularios que no andan. */}
        {!(showSetupNotice && process.env.NODE_ENV === "production") && (
          <Card className="mt-8 p-6 shadow-2xl shadow-black/30 sm:p-8">
            {children}
          </Card>
        )}
      </Container>
    </div>
  );
}
