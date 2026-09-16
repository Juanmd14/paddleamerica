import { getTournament } from "@/lib/data";
import { formatDateRange } from "@/lib/format";
import { ogImage, ogSize } from "@/lib/og";

export const alt = "Torneo de pádel";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await getTournament(slug);

  return ogImage({
    eyebrow: tournament ? `Torneo · ${tournament.category}` : "Torneos",
    title: tournament?.name ?? "Torneo no encontrado",
    subtitle: tournament
      ? `${formatDateRange(tournament.starts_on, tournament.ends_on)} · ${tournament.city}`
      : undefined,
  });
}
