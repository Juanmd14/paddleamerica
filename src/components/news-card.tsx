import Link from "next/link";
import { Cover } from "@/components/cover";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/types/models";

type NewsCardProps = {
  article: NewsArticle;
  /** Versión grande: imagen y texto lado a lado en pantallas anchas. */
  featured?: boolean;
};

export function NewsCard({ article, featured = false }: NewsCardProps) {
  return (
    <article
      className={cn(
        "group relative",
        featured && "lg:grid lg:grid-cols-2 lg:items-center lg:gap-10",
      )}
    >
      <div className="overflow-hidden rounded-card">
        <Cover
          src={article.cover_url}
          alt=""
          seed={article.id}
          className="transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
          sizes={
            featured
              ? "(min-width: 1024px) 50vw, 100vw"
              : "(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
          }
        />
      </div>
      <div className={cn("mt-4", featured && "lg:mt-0")}>
        <div className="flex items-center gap-3 text-sm">
          {article.tag && <Badge tone="primary">{article.tag}</Badge>}
          <time
            dateTime={article.published_at}
            className="text-muted-foreground"
          >
            {formatDate(article.published_at)}
          </time>
        </div>
        <h3
          className={cn(
            "mt-3 font-bold tracking-tight transition-colors group-hover:text-accent",
            featured ? "text-2xl sm:text-3xl" : "text-lg leading-snug",
          )}
        >
          <Link
            href={`/noticias/${article.slug}`}
            className="after:absolute after:inset-0"
          >
            {article.title}
          </Link>
        </h3>
        {article.excerpt && (
          <p
            className={cn(
              "mt-2 text-muted-foreground",
              featured ? "text-lg leading-8" : "line-clamp-2 text-sm leading-6",
            )}
          >
            {article.excerpt}
          </p>
        )}
      </div>
    </article>
  );
}
