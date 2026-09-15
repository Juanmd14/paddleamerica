import { ArrowRight } from "lucide-react";
import Link from "next/link";

type SectionHeadingProps = {
  title: string;
  href?: string;
  linkLabel?: string;
};

export function SectionHeading({
  title,
  href,
  linkLabel = "Ver todo",
}: SectionHeadingProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="font-display text-3xl leading-none font-bold uppercase sm:text-4xl">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-semibold text-accent transition-colors hover:text-pista-800"
        >
          {linkLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
