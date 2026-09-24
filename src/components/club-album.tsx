"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PhotoLightbox } from "@/components/photo-lightbox";
import type { ClubPhoto, Tournament } from "@/types/models";

/** Galería pública del álbum de un club. Cada foto se abre en grande en la misma página. */
export function ClubAlbum({
  photos,
  tournaments,
}: {
  photos: ClubPhoto[];
  /** Para mostrar de qué torneo es cada foto. */
  tournaments: Pick<Tournament, "id" | "name" | "slug">[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const tournamentOf = new Map(
    tournaments.map((tournament) => [tournament.id, tournament]),
  );
  const tournamentLink = (photo: ClubPhoto) => {
    const tournament = photo.tournament_id
      ? tournamentOf.get(photo.tournament_id)
      : undefined;
    return (
      tournament && (
        <Link
          href={`/torneos/${tournament.slug}`}
          className="text-xs font-semibold text-accent hover:text-accent-hover"
        >
          {tournament.name}
        </Link>
      )
    );
  };

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {photos.map((photo, index) => {
          const tournament = tournamentLink(photo);
          return (
            <li key={photo.id}>
              <figure>
                <button
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  aria-label={`Ver en grande: ${photo.caption ?? "foto del club"}`}
                  className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-card bg-muted"
                >
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? "Foto del club"}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
                {(photo.caption || tournament) && (
                  <figcaption className="mt-2 text-sm">
                    {photo.caption && (
                      <span className="block text-foreground-soft">
                        {photo.caption}
                      </span>
                    )}
                    {tournament}
                  </figcaption>
                )}
              </figure>
            </li>
          );
        })}
      </ul>

      <PhotoLightbox
        photos={photos.map((photo) => {
          const tournament = tournamentLink(photo);
          return {
            url: photo.url,
            alt: photo.caption ?? "Foto del club",
            caption: (photo.caption || tournament) && (
              <>
                {photo.caption && (
                  <span className="block text-white">{photo.caption}</span>
                )}
                {tournament}
              </>
            ),
          };
        })}
        index={openIndex}
        onChange={setOpenIndex}
        onClose={() => setOpenIndex(null)}
      />
    </>
  );
}
