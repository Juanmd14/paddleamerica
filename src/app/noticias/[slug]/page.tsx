import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cover } from "@/components/cover";
import { NewsCard } from "@/components/news-card";
import { SectionHeading } from "@/components/section-heading";
import { ShareButton } from "@/components/share-button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { getNews, getNewsArticle } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { paragraphs } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/noticias/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsArticle(slug);
  if (!article) return { title: "Noticia no encontrada" };

  return {
    title: article.title,
    description: article.excerpt ?? undefined,
    openGraph: {
      type: "article",
      publishedTime: article.published_at,
      authors: article.author ? [article.author] : undefined,
    },
  };
}

export default async function NewsArticlePage({
  params,
}: PageProps<"/noticias/[slug]">) {
  const { slug } = await params;
  const article = await getNewsArticle(slug);
  if (!article) notFound();

  const related = (await getNews({ limit: 4 }))
    .filter((other) => other.slug !== article.slug)
    .slice(0, 3);

  return (
    <>
      <article>
        <Container className="max-w-3xl py-12 sm:py-16">
          <Link
            href="/noticias"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Todas las noticias
          </Link>

          <div className="mt-8 flex items-center gap-3 text-sm">
            {article.tag && <Badge tone="primary">{article.tag}</Badge>}
            <time
              dateTime={article.published_at}
              className="text-muted-foreground"
            >
              {formatDate(article.published_at)}
            </time>
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl sm:leading-tight">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="mt-5 text-xl leading-8 text-muted-foreground">
              {article.excerpt}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
            <p className="text-sm">
              {article.author ? (
                <>
                  Por <span className="font-semibold">{article.author}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Redacción</span>
              )}
            </p>
            <ShareButton
              title={article.title}
              text={article.excerpt ?? undefined}
              variant="ghost"
            />
          </div>

          <Cover
            src={article.cover_url}
            alt=""
            seed={article.id}
            preload
            className="mt-8 rounded-card"
            sizes="(min-width: 768px) 720px, 100vw"
          />

          <div className="mt-10 max-w-prose space-y-6 text-lg leading-8 text-foreground-soft">
            {paragraphs(article.body).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </Container>
      </article>

      {related.length > 0 && (
        <section className="border-t border-border bg-surface">
          <Container className="py-14 sm:py-16">
            <SectionHeading title="Más noticias" href="/noticias" />
            <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((other) => (
                <NewsCard key={other.id} article={other} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
