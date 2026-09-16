/**
 * Aviso cuando falta Supabase. En desarrollo explica cómo configurarlo;
 * en producción muestra un mensaje neutro para el público.
 */
export function SupabaseNotice() {
  if (process.env.NODE_ENV === "production") {
    return (
      <div className="rounded-card border border-border bg-muted p-6 text-center">
        <h2 className="font-semibold">
          Las cuentas no están disponibles por el momento
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Volvé a intentar más tarde.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-warning-border bg-warning-soft p-6 text-warning">
      <h2 className="font-semibold">Falta configurar Supabase</h2>
      <p className="mt-2 text-sm leading-6">
        Completá <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
        <code className="font-mono">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>{" "}
        en <code className="font-mono">.env.local</code> y reiniciá{" "}
        <code className="font-mono">npm run dev</code>. Los pasos están en el
        README. (Este aviso solo se ve en desarrollo).
      </p>
    </div>
  );
}
