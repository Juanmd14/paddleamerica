import type { Metadata } from "next";
import { createArticle } from "@/app/admin/noticias/actions";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { NewsForm } from "@/components/admin/news-form";
import { requireAdmin } from "@/lib/auth";
import { toDateTimeLocal } from "@/lib/format";

export const metadata: Metadata = { title: "Nueva noticia" };

export default async function NewArticlePage() {
  await requireAdmin("/admin/noticias/nueva");

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Nueva noticia" />
      <NewsForm
        action={createArticle}
        defaultPublishedAt={toDateTimeLocal(new Date())}
        submitLabel="Guardar noticia"
      />
    </div>
  );
}
