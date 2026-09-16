import { MapPin, Navigation } from "lucide-react";
import { ShareButton } from "@/components/share-button";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Tournament } from "@/types/models";

/** Dirección para el mapa: la cargada o, si no hay, sede y ciudad. */
export function tournamentPlace(
  tournament: Pick<Tournament, "address" | "venue" | "city">,
) {
  return (
    tournament.address ||
    [tournament.venue, tournament.city].filter(Boolean).join(", ")
  );
}

/** Link de Google Maps: el que cargó el admin o una búsqueda por dirección. */
export function directionsUrl(
  tournament: Pick<Tournament, "address" | "venue" | "city" | "maps_url">,
) {
  return (
    tournament.maps_url ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tournamentPlace(tournament))}`
  );
}

/** Mapa integrado de Google Maps (sin API key) + Cómo llegar y Compartir. */
export function TournamentMap({
  tournament,
  shareText,
}: {
  tournament: Tournament;
  shareText: string;
}) {
  const place = tournamentPlace(tournament);

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[16/10] bg-muted sm:aspect-[16/8]">
        <iframe
          title={`Mapa: ${place}`}
          src={`https://www.google.com/maps?q=${encodeURIComponent(place)}&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 size-full border-0"
        />
      </div>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <p className="flex items-start gap-2 text-sm">
          <MapPin
            className="mt-0.5 size-4 shrink-0 text-accent"
            aria-hidden="true"
          />
          <span>
            <span className="block font-semibold">{tournament.venue}</span>
            <span className="text-muted-foreground">{place}</span>
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={directionsUrl(tournament)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({ variant: "secondary", size: "sm" })}
          >
            <Navigation className="size-4" aria-hidden="true" />
            Cómo llegar
          </a>
          <ShareButton
            title={tournament.name}
            text={shareText}
            className="h-9 px-4"
          />
        </div>
      </div>
    </Card>
  );
}
