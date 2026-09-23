import Image from "next/image";
import Link from "next/link";
import type { ClubPhoto, Tournament } from "@/types/models";

/** Galería pública del álbum de un club. Cada foto se abre en grande. */
export function ClubAlbum({
  photos,
  tournaments,
}: {
  photos: ClubPhoto[];
  /** Para mostrar de qué torneo es cada foto. */
  tournaments: Pick<Tournament, "id" | "name" | "slug">[];
}) {
  const tournamentOf = new Map(
    tournaments.map((tournament) => [tournament.id, tournament]),
  );

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {photos.map((photo) => {
        const tournament = photo.tournament_id
          ? tournamentOf.get(photo.tournament_id)
          : undefined;
        return (
          <li key={photo.id}>
            <figure>
              <a
                href={photo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden rounded-card bg-muted"
              >
                <Image
                  src={photo.url}
                  alt={photo.caption ?? "Foto del club"}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </a>
              {(photo.caption || tournament) && (
                <figcaption className="mt-2 text-sm">
                  {photo.caption && (
                    <span className="block text-foreground-soft">
                      {photo.caption}
                    </span>
                  )}
                  {tournament && (
                    <Link
                      href={`/torneos/${tournament.slug}`}
                      className="text-xs font-semibold text-accent hover:text-accent-hover"
                    >
                      {tournament.name}
                    </Link>
                  )}
                </figcaption>
              )}
            </figure>
          </li>
        );
      })}
    </ul>
  );
}
