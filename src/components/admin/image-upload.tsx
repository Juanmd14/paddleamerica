"use client";

import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const ratios = {
  flyer: "aspect-[4/5] max-w-xs",
  video: "aspect-video max-w-md",
  square: "aspect-square max-w-48",
  wide: "aspect-[21/9]",
};

const MAX_SIDE = 1600;
const MAX_BYTES = 5 * 1024 * 1024;

type ImageUploadProps = {
  /** Nombre del input oculto que recibe la URL pública. */
  name: string;
  label: string;
  folder: "flyers" | "noticias" | "jugadores" | "sitio";
  ratio: keyof typeof ratios;
  defaultValue?: string | null;
  hint?: string;
};

/** Achica la imagen en el navegador (lado mayor 1600 px) y la pasa a WebP, o JPEG si el navegador no sabe. */
async function resize(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  const webp = await toBlob("image/webp");
  if (webp?.type === "image/webp") return webp;
  const jpeg = await toBlob("image/jpeg");
  if (!jpeg) throw new Error("No se pudo procesar la imagen.");
  return jpeg;
}

/** Sube la imagen a Supabase Storage (bucket "media") con la sesión del admin. */
export function ImageUpload({
  name,
  label,
  folder,
  ratio,
  defaultValue,
  hint,
}: ImageUploadProps) {
  const id = useId();
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Elegí un archivo de imagen (JPG, PNG o WebP).");
      return;
    }

    setUploading(true);
    try {
      const blob = await resize(file);
      if (blob.size > MAX_BYTES) {
        throw new Error("La imagen pesa más de 5 MB incluso achicada.");
      }
      const extension = blob.type === "image/webp" ? "webp" : "jpg";
      const path = `${folder}/${crypto.randomUUID()}.${extension}`;

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, blob, {
          contentType: blob.type,
          cacheControl: "31536000",
        });
      if (uploadError) throw uploadError;

      setUrl(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
    } catch (uploadError) {
      console.error(uploadError);
      setError(
        uploadError instanceof Error && uploadError.message.includes("5 MB")
          ? uploadError.message
          : "No pudimos subir la imagen. Probá de nuevo.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-foreground-soft">{label}</p>
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="space-y-3">
          <div
            className={cn(
              "relative w-full overflow-hidden rounded-card border border-border bg-muted",
              ratios[ratio],
            )}
          >
            <Image
              src={url}
              alt=""
              fill
              sizes="320px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <label
              htmlFor={id}
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-sm font-semibold hover:bg-muted"
            >
              <ImagePlus className="size-4" aria-hidden="true" />
              Cambiar
            </label>
            <Button variant="ghost" size="sm" onClick={() => setUrl("")}>
              <Trash2 className="size-4" aria-hidden="true" />
              Quitar
            </Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-border-strong bg-surface p-6 text-center transition-colors hover:border-pista-400 hover:bg-pista-50",
            ratios[ratio],
          )}
        >
          {uploading ? (
            <LoaderCircle
              className="size-7 animate-spin text-accent motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            <ImagePlus className="size-7 text-accent" aria-hidden="true" />
          )}
          <span className="text-sm font-semibold">
            {uploading ? "Subiendo…" : "Subir imagen"}
          </span>
          {hint && (
            <span className="text-xs text-muted-foreground">{hint}</span>
          )}
        </label>
      )}

      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={uploading}
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
