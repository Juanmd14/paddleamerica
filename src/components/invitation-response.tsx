"use client";

import { Check, LoaderCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { respondInvitation } from "@/app/torneos/[slug]/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InvitationResponseProps = {
  registrationId: number;
  slug: string;
  /** Se llama después de responder bien (ej. para recargar una lista). */
  onDone?: () => void;
  className?: string;
};

/** Botones para aceptar o rechazar una invitación a jugar un torneo. */
export function InvitationResponse({
  registrationId,
  slug,
  onDone,
  className,
}: InvitationResponseProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [choice, setChoice] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  function respond(accept: boolean) {
    setChoice(accept);
    setError("");
    startTransition(async () => {
      const result = await respondInvitation(registrationId, accept, slug);
      if (result.message) {
        setError(result.message);
        return;
      }
      router.refresh();
      onDone?.();
    });
  }

  const spinner = (
    <LoaderCircle
      className="size-4 animate-spin motion-reduce:animate-none"
      aria-hidden="true"
    />
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={pending} onClick={() => respond(true)}>
          {pending && choice === true ? (
            spinner
          ) : (
            <Check className="size-4" aria-hidden="true" />
          )}
          Aceptar
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => respond(false)}
        >
          {pending && choice === false ? (
            spinner
          ) : (
            <X className="size-4" aria-hidden="true" />
          )}
          Rechazar
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
