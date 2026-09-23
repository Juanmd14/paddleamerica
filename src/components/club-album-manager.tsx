"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { addClubPhoto, deleteClubPhoto } from "@/app/mi-club/fotos/actions";
import { Field, fieldProps } from "@/components/admin/admin-ui";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { ImageUpload } from "@/components/admin/image-upload";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { SubmitButton } from "@/components/submit-button";
import { Alert } from "@/components/ui/alert";
import { Input, Select } from "@/components/ui/input";
import type { ClubPhoto, Tournament } from "@/types/models";

type ClubAlbumManagerProps = {
  clubId: number;
  photos: ClubPhoto[];
  /** Torneos del club, para marcar de qué torneo es la foto. */
  tournaments: Pick<Tournament, "id" | "name">[];
  /** Dueño de club: sube a su carpeta. Sin esto (admin), a la carpeta general. */
  ownerId?: string;
};

/** Subir y borrar fotos del álbum de un club. */
export function ClubAlbumManager({
  clubId,
  photos,
  tournaments,
  ownerId,
}: ClubAlbumManagerProps) {
  const { state, errors, pending, onSubmit } = useAdminForm(
    addClubPhoto.bind(null, clubId),
  );
  // Cambiar la key vacía el formulario después de cada foto guardada.
  const [round, setRound] = useState(0);

  return (
    <div className="space-y-6">
      <form
        key={round}
        onSubmit={onSubmit}
        noValidate
        className="grid gap-5 rounded-card border border-border bg-surface p-5 sm:grid-cols-[14rem_1fr] sm:p-6"
      >
        <div>
          <ImageUpload
            name="url"
            label="Foto"
            folder={ownerId ? "album-club" : "clubes"}
            subfolder={ownerId}
            ratio="video"
          />
          {errors.url && (
            <p className="mt-1.5 text-sm text-danger">{errors.url}</p>
          )}
        </div>
        <div className="space-y-4">
          {state.message && <Alert tone="danger">{state.message}</Alert>}
          {state.ok && (
            <Alert tone="success">
              Subimos la foto.{" "}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => setRound((value) => value + 1)}
              >
                Subir otra
              </button>
            </Alert>
          )}
          <Field
            name="caption"
            label="Texto"
            optional
            error={errors.caption}
            hint="Ej. La final del sábado."
          >
            <Input {...fieldProps("caption", errors.caption)} maxLength={140} />
          </Field>
          {tournaments.length > 0 && (
            <Field
              name="tournament_id"
              label="Torneo"
              optional
              error={errors.tournament_id}
            >
              <Select {...fieldProps("tournament_id", errors.tournament_id)}>
                <option value="">Ninguno</option>
                {tournaments.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <SubmitButton pending={pending} pendingLabel="Guardando…">
            Agregar al álbum
          </SubmitButton>
        </div>
      </form>

      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className="overflow-hidden rounded-card border border-border bg-surface"
            >
              <div className="relative aspect-video bg-muted">
                <Image
                  src={photo.url}
                  alt={photo.caption ?? "Foto del club"}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="flex items-start justify-between gap-2 p-3">
                <p className="min-w-0 text-sm text-foreground-soft">
                  {photo.caption || (
                    <span className="text-muted-foreground">Sin texto</span>
                  )}
                </p>
                <form action={deleteClubPhoto.bind(null, clubId, photo.id)}>
                  <ConfirmSubmitButton
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger-soft hover:text-danger"
                    confirmMessage="¿Borrar esta foto del álbum?"
                    pendingLabel="…"
                    aria-label="Borrar foto"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </ConfirmSubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Todavía no hay fotos en el álbum.
        </p>
      )}
    </div>
  );
}
