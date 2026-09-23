import { isStorageUrl } from "@/lib/admin-form";

/**
 * Fotos de una noticia, además de la portada. Se guardan en news.photos
 * (jsonb) en el orden en que las cargó el admin.
 */
export type NewsPhoto = {
  url: string;
  caption: string | null;
};

export const MAX_NEWS_PHOTOS = 30;
export const MAX_CAPTION = 140;

/** Lee la columna jsonb descartando lo que no sirva (igual que is_valid_news_photos). */
export function newsPhotos(value: unknown): NewsPhoto[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const { url, caption } = item as Record<string, unknown>;
      if (typeof url !== "string" || !url || !isStorageUrl(url)) return [];
      return [
        {
          url,
          caption:
            typeof caption === "string" && caption.trim()
              ? caption.trim().slice(0, MAX_CAPTION)
              : null,
        },
      ];
    })
    .slice(0, MAX_NEWS_PHOTOS);
}
