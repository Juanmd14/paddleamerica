"use client";

import { Share2 } from "lucide-react";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { whatsappShareUrl } from "@/lib/utils";

type ShareButtonProps = {
  title: string;
  text?: string;
  variant?: ButtonVariant;
  className?: string;
};

/** Comparte la página con el menú nativo del celular; en escritorio abre WhatsApp. */
export function ShareButton({
  title,
  text,
  variant = "outline",
  className,
}: ShareButtonProps) {
  async function share() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // El usuario cerró el menú de compartir.
      }
      return;
    }

    window.open(
      whatsappShareUrl(`${title} ${url}`),
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <Button variant={variant} onClick={share} className={className}>
      <Share2 className="size-4" aria-hidden="true" />
      Compartir
    </Button>
  );
}
