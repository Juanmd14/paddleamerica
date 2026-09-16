"use client";

import { Camera, LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { updateAvatar } from "@/app/mi-cuenta/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MAX_IMAGE_BYTES, resizeImage } from "@/lib/resize-image";
import { createClient } from "@/lib/supabase/client";

type AvatarUploadProps = {
  userId: string;
  name: string;
  avatarUrl: string | null;
};

/** Foto de perfil: se sube a media/perfiles/<id>/ y se guarda al instante. */
export function AvatarUpload({ userId, name, avatarUrl }: AvatarUploadProps) {
  const id = useId();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const busy = uploading || saving;

  function save(url: string | null) {
    startSaving(async () => {
      const result = await updateAvatar(url);
      if (result.message) {
        setError(result.message);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setSaved(false);
    if (!file.type.startsWith("image/")) {
      setError("Elegí una foto (JPG, PNG o WebP).");
      return;
    }

    setUploading(true);
    try {
      // Una foto de perfil no necesita más de 512 px.
      const blob = await resizeImage(file, 512);
      if (blob.size > MAX_IMAGE_BYTES) {
        throw new Error("La foto pesa demasiado.");
      }
      const extension = blob.type === "image/webp" ? "webp" : "jpg";
      const path = `perfiles/${userId}/${crypto.randomUUID()}.${extension}`;

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, blob, {
          contentType: blob.type,
          cacheControl: "31536000",
        });
      if (uploadError) throw uploadError;

      save(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
    } catch (uploadError) {
      console.error(uploadError);
      setError("No pudimos subir la foto. Probá con otra.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar
        name={name}
        src={avatarUrl}
        size="lg"
        className="ring-2 ring-oro-400"
      />
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap gap-2">
          <label
            htmlFor={id}
            aria-disabled={busy}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-sm font-semibold transition-colors hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-60"
          >
            {busy ? (
              <LoaderCircle
                className="size-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : (
              <Camera className="size-4" aria-hidden="true" />
            )}
            {busy ? "Guardando…" : avatarUrl ? "Cambiar foto" : "Subir foto"}
          </label>
          {avatarUrl && (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => {
                setError("");
                setSaved(false);
                save(null);
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Quitar
            </Button>
          )}
        </div>
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : (
          <p role="status" className="text-xs text-muted-foreground">
            {saved
              ? "Listo, ya se ve en tu cuenta."
              : "Se ve en el menú y cuando invitás a tu pareja."}
          </p>
        )}
      </div>
    </div>
  );
}
