import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

/** Tamaño estándar para compartir en WhatsApp, Instagram, X y Facebook. */
export const ogSize = { width: 1200, height: 630 };

/**
 * Baja Barlow Condensed de Google Fonts en TTF (ImageResponse no lee woff2),
 * solo con los caracteres que se usan. Si falla, se usa la fuente por defecto.
 */
async function loadDisplayFont(text: string) {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&text=${encodeURIComponent(text)}`,
    ).then((res) => res.text());
    const url = css.match(
      /src: url\((.+?)\) format\('(opentype|truetype)'\)/,
    )?.[1];
    if (!url) return [];
    const data = await fetch(url).then((res) => res.arrayBuffer());
    return [{ name: "Barlow Condensed", data, weight: 700 as const }];
  } catch {
    return [];
  }
}

type OgImageProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
};

/** Imagen para compartir: fondo noche, cancha, pelota y el título en grande. */
export async function ogImage({ eyebrow, title, subtitle }: OgImageProps) {
  const fonts = await loadDisplayFont(
    `${siteConfig.name}${eyebrow}${title}${subtitle ?? ""}`.toUpperCase() +
      siteConfig.name,
  );
  const titleSize = title.length > 34 ? 88 : title.length > 22 ? 104 : 128;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background:
          "radial-gradient(90% 90% at 80% 0%, #1d2940 0%, #0a101e 70%)",
        color: "white",
        fontFamily: "Barlow Condensed",
      }}
    >
      <svg
        width="380"
        height="676"
        viewBox="0 0 225 400"
        style={{ position: "absolute", right: 60, top: -23, opacity: 0.12 }}
      >
        <g fill="none" stroke="white" strokeWidth="2">
          <rect x="30" y="60" width="165" height="280" />
          <line x1="30" y1="103" x2="195" y2="103" />
          <line x1="30" y1="297" x2="195" y2="297" />
          <line x1="112.5" y1="103" x2="112.5" y2="297" />
          <line x1="22" y1="200" x2="203" y2="200" strokeWidth="4" />
        </g>
      </svg>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="15" fill="#ffbb1f" />
            <path
              d="M5 8.5c5.5 2.5 8 7 8 15M27 23.5c-5.5-2.5-8-7-8-15"
              fill="none"
              stroke="#0a101e"
              strokeWidth="2.25"
              strokeLinecap="round"
            />
          </svg>
          <div style={{ display: "flex", fontSize: 44, letterSpacing: 1 }}>
            {siteConfig.name.toUpperCase()}
          </div>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 30,
              letterSpacing: 6,
              color: "#ffbb1f",
            }}
          >
            {eyebrow.toUpperCase()}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 12,
              fontSize: titleSize,
              lineHeight: 0.92,
            }}
          >
            {title.toUpperCase()}
          </div>
          {subtitle && (
            <div
              style={{
                display: "flex",
                marginTop: 24,
                fontSize: 36,
                color: "#9fb0c9",
              }}
            >
              {subtitle.toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>,
    { ...ogSize, fonts },
  );
}
