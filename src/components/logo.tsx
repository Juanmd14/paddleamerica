import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Isotipo: pelota dorada. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="15" className="fill-oro-400" />
      <path
        d="M5 8.5c5.5 2.5 8 7 8 15M27 23.5c-5.5-2.5-8-7-8-15"
        fill="none"
        strokeWidth="2.25"
        strokeLinecap="round"
        className="stroke-noche-950"
      />
    </svg>
  );
}

/** Logo completo. Hereda el color de texto (usalo sobre fondo oscuro o claro). */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-9" />
      <span className="flex flex-col">
        <span className="font-display text-xl leading-none font-bold tracking-wide uppercase">
          {siteConfig.name}
        </span>
        <span className="mt-0.5 text-[0.625rem] leading-none font-semibold tracking-[0.25em] text-oro-400 uppercase">
          {siteConfig.tagline}
        </span>
      </span>
    </span>
  );
}
