import { ArrowRight } from "lucide-react";
import Link from "next/link";

type SectionHeadingProps = {
  title: string;
  eyebrow?: string;
  href?: string;
  linkLabel?: string;
};

export function SectionHeading({
  title,
  eyebrow,
  href,
  linkLabel = "Ver todo",
}: SectionHeadingProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold tracking-[0.25em] text-oro-600 uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-3xl leading-none font-bold uppercase sm:text-4xl">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
        >
          {linkLabel}
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </Link>
      )}
    </div>
  );
}
