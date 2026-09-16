import { ExternalLink, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deleteArticle, updateArticle } from "@/app/admin/noticias/actions";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { NewsForm } from "@/components/admin/news-form";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { getNewsById } from "@/lib/data";
import { toDateTimeLocal } from "@/lib/format";
import { firstParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Editar noticia" };

export default async function EditArticlePage({
  params,
  searchParams,
}: PageProps<"/admin/noticias/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/noticias/${id}`);

  const article = await getNewsById(Number(id));
  if (!article) notFound();

  const query = await searchParams;
  const error = firstParam(query.error);
  const saved = firstParam(query.guardado);
  const isLive =
    article.is_published && new Date(article.published_at) <= new Date();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Editar noticia"
        description={article.title}
        actions={
          isLive && (
            <ButtonLink
              href={`/noticias/${article.slug}`}
              size="sm"
              variant="ghost"
              target="_blank"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              Ver en el sitio
            </ButtonLink>
          )
        }
      />
      {error && <Alert tone="danger">{error}</Alert>}
      {saved && <Alert tone="success">Guardamos la noticia.</Alert>}

      <NewsForm
        action={updateArticle.bind(null, article.id)}
        article={article}
        defaultPublishedAt={toDateTimeLocal(article.published_at)}
        submitLabel="Guardar cambios"
      />

      <form
        action={deleteArticle.bind(null, article.id)}
        className="border-t border-border pt-6"
      >
        <ConfirmSubmitButton
          variant="ghost"
          size="sm"
          className="text-danger hover:bg-danger-soft hover:text-danger"
          confirmMessage="¿Borrar esta noticia? No se puede deshacer."
          pendingLabel="Borrando…"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Borrar noticia
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
