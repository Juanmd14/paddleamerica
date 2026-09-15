import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-noche-100 text-noche-700",
  primary: "bg-oro-100 text-oro-800",
  accent: "bg-pista-50 text-pista-700",
  success: "bg-emerald-50 text-emerald-700",
  danger: "bg-red-50 text-red-700",
  dark: "bg-noche-900 text-white",
  inverse: "bg-white/10 text-white",
};

export type BadgeTone = keyof typeof tones;
export const badgeTones = Object.keys(tones) as BadgeTone[];

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
