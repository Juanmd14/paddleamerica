"use client";

import { RotateCw } from "lucide-react";
import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="font-display text-8xl leading-none font-bold text-oro-400 uppercase">
        Let
      </p>
      <h1 className="mt-4 font-display text-4xl font-bold uppercase">
        Se repite el punto
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        No pudimos cargar esta página. Probá de nuevo en unos segundos.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => retry()}>
          <RotateCw className="size-4" aria-hidden="true" />
          Reintentar
        </Button>
        <ButtonLink href="/" variant="outline">
          Volver al inicio
        </ButtonLink>
      </div>
    </Container>
  );
}
