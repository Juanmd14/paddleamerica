"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { ImageUpload } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MAX_CAPTION,
  MAX_NEWS_PHOTOS,
  type NewsPhoto,
} from "@/lib/news-photos";

/**
 * Fotos de la nota, además de la portada. Cada una viaja en el formulario
 * como un par de inputs ocultos (photo_url / photo_caption), en orden.
 *
 * El cargador de abajo es el mismo ImageUpload de siempre: cuando termina de
 * subir, la foto pasa a la lista y el cargador se reinicia (por eso el key).
 */
export function NewsPhotosField({ photos: initial }: { photos: NewsPhoto[] }) {
  const [photos, setPhotos] = useState(initial);
  const [uploaderKey, setUploaderKey] = useState(0);
  const full = photos.length >= MAX_NEWS_PHOTOS;

  function add(url: string) {
    if (!url) return;
    setPhotos((current) => [...current, { url, caption: null }]);
    setUploaderKey((key) => key + 1);
  }

  function move(index: number, to: number) {
    setPhotos((current) => {
      if (to < 0 || to >= current.length) return current;
      const next = [...current];
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground-soft">
          Fotos de la nota
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Se ven abajo del texto, en el orden de esta lista. Hasta{" "}
          {MAX_NEWS_PHOTOS}.
        </p>
      </div>

      {photos.length > 0 && (
        <ul className="space-y-3">
          {photos.map((photo, index) => (
            <li
              key={photo.url}
              className="flex gap-3 rounded-lg border border-border p-3"
            >
              <input type="hidden" name="photo_url" value={photo.url} />
              <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <Input
                  name="photo_caption"
                  defaultValue={photo.caption ?? ""}
                  maxLength={MAX_CAPTION}
                  placeholder="Epígrafe (opcional)"
                  aria-label={`Epígrafe de la foto ${index + 1}`}
                />
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => move(index, index - 1)}
                    disabled={index === 0}
                    aria-label={`Subir la foto ${index + 1}`}
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => move(index, index + 1)}
                    disabled={index === photos.length - 1}
                    aria-label={`Bajar la foto ${index + 1}`}
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setPhotos((current) =>
                        current.filter((_, other) => other !== index),
                      )
                    }
                    aria-label={`Quitar la foto ${index + 1}`}
                    className="text-danger"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {full ? (
        <p className="text-sm text-muted-foreground">
          Llegaste al máximo de {MAX_NEWS_PHOTOS} fotos.
        </p>
      ) : (
        <ImageUpload
          key={uploaderKey}
          name="_foto_nueva"
          label="Agregar una foto"
          folder="noticias"
          ratio="video"
          onChange={add}
          hint="Se suma a la lista apenas termina de subir."
        />
      )}
    </div>
  );
}
