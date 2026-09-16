"use client";

import { ChevronRight } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const OPEN_EVENT = "paddle:abrir-inscripcion";
const OPEN_HASHES = ["#inscripcion", "#inscribirme"];

/**
 * Botón "Inscribirme" que despliega el formulario en la tarjeta.
 * Se abre solo si la URL trae #inscripcion (por ejemplo, al volver del login)
 * o cuando se toca la barra fija del celular.
 */
export function RegistrationToggle({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function openAndScroll() {
      setOpen(true);
      requestAnimationFrame(() =>
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
    if (OPEN_HASHES.includes(window.location.hash)) openAndScroll();
    window.addEventListener(OPEN_EVENT, openAndScroll);
    return () => window.removeEventListener(OPEN_EVENT, openAndScroll);
  }, []);

  return (
    <div ref={ref} className="scroll-mt-28">
      {open ? (
        children
      ) : (
        <Button size="lg" className="w-full" onClick={() => setOpen(true)}>
          Inscribirme
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

/** Barra fija del celular: "18/24 parejas · Inscribirme ▸". Abre el formulario de la tarjeta. */
export function MobileRegistrationBar({ summary }: { summary: string }) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-white/10 bg-noche-950/95 px-4 py-3 text-white backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
        <p className="text-sm font-medium text-noche-200">{summary}</p>
        <Button
          size="sm"
          onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
        >
          Inscribirme
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
