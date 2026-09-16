import { getPlayer, getRankingPosition } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { genderLabel, playerName } from "@/lib/labels";
import { ogImage, ogSize } from "@/lib/og";

export const alt = "Jugador del ranking regional";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const player = await getPlayer(slug);
  if (!player) {
    return ogImage({ eyebrow: "Ranking", title: "Jugador no encontrado" });
  }

  const position = await getRankingPosition(player);
  return ogImage({
    eyebrow: `#${position} ranking ${genderLabel(player.gender).toLowerCase()}`,
    title: playerName(player),
    subtitle: `${player.category} · ${formatNumber(player.ranking_points)} pts${player.club ? ` · ${player.club}` : ""}`,
  });
}
