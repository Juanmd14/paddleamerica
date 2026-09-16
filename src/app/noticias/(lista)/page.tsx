import { Newspaper } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { NewsCard } from "@/components/news-card";
import { PageHeader } from "@/components/page-header";
import { Container } from "@/components/ui/container";
import { getNews } from "@/lib/data";

export const metadata: Metadata = {
  title: "Noticias",
  description:
    "Resultados, inscripciones y todo lo que pasa en el pádel de América y la zona.",
};

export default async function NewsPage() {
  const [lead, ...rest] = await getNews();

  return (
    <>
      <PageHeader
        eyebrow="Actualidad"
        title="Noticias"
        description="Resultados, inscripciones y todo lo que pasa en el pádel de la zona."
      />

      <Container className="py-12 sm:py-16">
        {lead ? (
          <>
            <NewsCard article={lead} featured />
            {rest.length > 0 && (
              <div className="mt-16 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </>
        ) : (
          <EmptyState icon={Newspaper} title="Todavía no hay noticias" />
        )}
      </Container>
    </>
  );
}
