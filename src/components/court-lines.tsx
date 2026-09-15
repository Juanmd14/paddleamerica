/** Líneas de una cancha de pádel vista desde arriba. Usa currentColor. */
export function CourtLines({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 225"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <rect x="60" y="30" width="280" height="165" />
      <line x1="103" y1="30" x2="103" y2="195" />
      <line x1="297" y1="30" x2="297" y2="195" />
      <line x1="103" y1="112.5" x2="297" y2="112.5" />
      <line x1="200" y1="22" x2="200" y2="203" strokeWidth="4" />
    </svg>
  );
}
