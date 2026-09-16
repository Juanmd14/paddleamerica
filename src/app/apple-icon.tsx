import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ícono para la pantalla de inicio del iPhone: la pelota sobre azul noche. */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a101e",
      }}
    >
      <svg width="124" height="124" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="#ffbb1f" />
        <path
          d="M5 8.5c5.5 2.5 8 7 8 15M27 23.5c-5.5-2.5-8-7-8-15"
          fill="none"
          stroke="#0a101e"
          strokeWidth="2.25"
          strokeLinecap="round"
        />
      </svg>
    </div>,
    size,
  );
}
