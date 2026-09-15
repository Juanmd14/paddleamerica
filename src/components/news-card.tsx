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
    <article className="group">
      <Link
        href={`/noticias/${article.slug}`}
        className={cn(
          "block",
          featured && "lg:grid lg:grid-cols-2 lg:items-center lg:gap-10",
        )}
      >
        <Cover
          src={article.cover_url}
          alt=""
          className="rounded-card"
          sizes={
            featured
              ? "(min-width: 1024px) 50vw, 100vw"
              : "(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
          }
        />
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
              "mt-3 font-bold tracking-tight text-balance transition-colors group-hover:text-accent",
              featured ? "text-2xl sm:text-3xl" : "text-lg leading-snug",
            )}
          >
            {article.title}
          </h3>
          {article.excerpt && (
            <p
              className={cn(
                "mt-2 text-muted-foreground",
                featured
                  ? "text-lg leading-8"
                  : "line-clamp-2 text-sm leading-6",
              )}
            >
              {article.excerpt}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
