export function SupabaseNotice() {
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950">
      <h2 className="font-semibold">Falta configurar Supabase</h2>
      <p className="mt-2 text-sm leading-6">
        Completá <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
        <code className="font-mono">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>{" "}
        en <code className="font-mono">.env.local</code> y reiniciá{" "}
        <code className="font-mono">npm run dev</code>. Los pasos están en el
        README.
      </p>
    </div>
  );
}
