import { getNewsArticle } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { ogImage, ogSize } from "@/lib/og";

export const alt = "Noticia";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getNewsArticle(slug);

  return ogImage({
    eyebrow: article?.tag ? `Noticias · ${article.tag}` : "Noticias",
    title: article?.title ?? "Noticia no encontrada",
    subtitle: article ? formatDate(article.published_at) : undefined,
  });
}
