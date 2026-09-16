import { ogImage, ogSize } from "@/lib/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} · Pádel de ${siteConfig.region}`;
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    eyebrow: "Torneos · Ranking · Noticias",
    title: "Todo el pádel de la zona",
    subtitle: siteConfig.tagline,
  });
}
