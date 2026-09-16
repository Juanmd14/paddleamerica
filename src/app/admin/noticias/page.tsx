import { Newspaper, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader, Table, Td, Th } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/empty-state";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getAllNews } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { NewsArticle } from "@/types/models";

export const metadata: Metadata = { title: "Noticias" };

function publicationStatus(article: NewsArticle): {
  label: string;
  tone: BadgeTone;
} {
  if (!article.is_published) return { label: "Borrador", tone: "neutral" };
  if (new Date(article.published_at) > new Date()) {
    return { label: "Programada", tone: "accent" };
  }
  return { label: "Publicada", tone: "success" };
}

export default async function AdminNewsPage({
  searchParams,
}: PageProps<"/admin/noticias">) {
  await requireAdmin("/admin/noticias");
  const [news, params] = await Promise.all([getAllNews(), searchParams]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Noticias"
        actions={
          <ButtonLink href="/admin/noticias/nueva" size="sm">
            <Plus className="size-4" aria-hidden="true" />
            Nueva noticia
          </ButtonLink>
        }
      />
      {params.borrado && <Alert tone="success">Borramos la noticia.</Alert>}

      {news.length > 0 ? (
        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr>
                <Th>Título</Th>
                <Th>Fecha</Th>
                <Th>Estado</Th>
              </tr>
            </thead>
            <tbody>
              {news.map((article) => {
                const status = publicationStatus(article);
                return (
                  <tr key={article.id} className="hover:bg-muted/60">
                    <Td>
                      <Link
                        href={`/admin/noticias/${article.id}`}
                        className="font-semibold hover:text-accent"
                      >
                        {article.title}
                      </Link>
                      {article.tag && (
                        <p className="text-xs text-muted-foreground">
                          {article.tag}
                        </p>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-foreground-soft">
                      {formatDate(article.published_at)}
                    </Td>
                    <Td>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={Newspaper}
          title="Todavía no hay noticias"
          action={
            <ButtonLink href="/admin/noticias/nueva">
              Escribir la primera
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
