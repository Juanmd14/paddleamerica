/**
 * Líneas de una cancha de pádel vista desde arriba. Usa currentColor.
 * "horizontal" (400×225) para portadas 16:9; "vertical" (225×400) para flyers y fondos altos.
 */
export function CourtLines({
  className,
  orientation = "horizontal",
}: {
  className?: string;
  orientation?: "horizontal" | "vertical";
}) {
  const vertical = orientation === "vertical";

  return (
    <svg
      viewBox={vertical ? "0 0 225 400" : "0 0 400 225"}
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      {vertical ? (
        <>
          <rect x="30" y="60" width="165" height="280" />
          <line x1="30" y1="103" x2="195" y2="103" />
          <line x1="30" y1="297" x2="195" y2="297" />
          <line x1="112.5" y1="103" x2="112.5" y2="297" />
          <line x1="22" y1="200" x2="203" y2="200" strokeWidth="4" />
        </>
      ) : (
        <>
          <rect x="60" y="30" width="280" height="165" />
          <line x1="103" y1="30" x2="103" y2="195" />
          <line x1="297" y1="30" x2="297" y2="195" />
          <line x1="103" y1="112.5" x2="297" y2="112.5" />
          <line x1="200" y1="22" x2="200" y2="203" strokeWidth="4" />
        </>
      )}
    </svg>
  );
}
