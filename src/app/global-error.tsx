"use client";

import { useEffect } from "react";

/**
 * Último paracaídas: si falla el layout (por ejemplo, una lectura del header),
 * error.tsx no alcanza. Reemplaza toda la página, así que trae su propio HTML
 * y estilos en línea (las clases de Tailwind podrían no haber cargado).
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          padding: "24px",
          textAlign: "center",
          background: "#f7f9fc",
          color: "#0a101e",
          fontFamily: "system-ui, Arial, sans-serif",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            letterSpacing: "3px",
            fontWeight: 700,
            color: "#b8860b",
          }}
        >
          PADDLEAMERICA
        </p>
        <h1 style={{ margin: 0, fontSize: "28px" }}>Se cortó el partido</h1>
        <p style={{ margin: 0, maxWidth: "26rem", color: "#4a5a75" }}>
          No pudimos cargar el sitio. Probá de nuevo en unos segundos.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            marginTop: "8px",
            cursor: "pointer",
            border: 0,
            borderRadius: "999px",
            background: "#ffbb1f",
            color: "#0a101e",
            fontWeight: 700,
            fontSize: "15px",
            padding: "14px 28px",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
