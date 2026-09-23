import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ClubAlbumManager } from "@/components/club-album-manager";
import { requireClubOwner } from "@/lib/auth";
import { getClubPhotos, getClubTournaments, getMyClubs } from "@/lib/data";
import { cn, firstParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Álbum" };

export default async function ClubAlbumPage({
  searchParams,
}: PageProps<"/mi-club/fotos">) {
  const user = await requireClubOwner("/mi-club/fotos");
  const [clubs, query] = await Promise.all([getMyClubs(), searchParams]);
  // Con varios clubes, ?club=<id> elige cuál; si no es suyo, el primero.
  const club =
    clubs.find((option) => String(option.id) === firstParam(query.club)) ??
    clubs[0];
  if (!club) return null;

  const [photos, { upcoming, finished }] = await Promise.all([
    getClubPhotos(club.id),
    getClubTournaments(club.id),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Álbum del club"
        description={`Las fotos se ven en la página de ${club.name}. Podés marcar de qué torneo es cada una.`}
      />
      {clubs.length > 1 && (
        <nav aria-label="Club" className="flex flex-wrap gap-2">
          {clubs.map((option) => (
            <Link
              key={option.id}
              href={`/mi-club/fotos?club=${option.id}`}
              aria-current={option.id === club.id ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center rounded-full border px-4 text-sm font-semibold",
                option.id === club.id
                  ? "border-noche-950 bg-noche-950 text-white"
                  : "border-border-strong bg-surface text-foreground-soft",
              )}
            >
              {option.name}
            </Link>
          ))}
        </nav>
      )}
      <ClubAlbumManager
        key={club.id}
        clubId={club.id}
        photos={photos}
        tournaments={[...upcoming, ...finished]}
        ownerId={user.id}
      />
    </div>
  );
}
