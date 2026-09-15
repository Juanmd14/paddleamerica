import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cover } from "@/components/cover";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { getNewsArticle } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { paragraphs } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/noticias/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsArticle(slug);
  return {
    title: article?.title ?? "Noticia no encontrada",
    description: article?.excerpt ?? undefined,
  };
}

export default async function NewsArticlePage({
  params,
}: PageProps<"/noticias/[slug]">) {
  const { slug } = await params;
  const article = await getNewsArticle(slug);
  if (!article) notFound();

  return (
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
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="mt-4 text-xl leading-8 text-muted-foreground">
            {article.excerpt}
          </p>
        )}
        {article.author && (
          <p className="mt-6 text-sm font-medium">Por {article.author}</p>
        )}

        <Cover
          src={article.cover_url}
          alt=""
          className="mt-8 rounded-card"
          sizes="(min-width: 768px) 720px, 100vw"
        />

        <div className="mt-10 space-y-6 text-lg leading-8 text-noche-700">
          {paragraphs(article.body).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </Container>
    </article>
  );
}
