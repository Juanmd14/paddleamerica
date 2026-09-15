@AGENTS.md

# Punto de Oro · Pádel regional

Regional padel site: tournaments, player ranking and news.

- UI text is in Spanish (Argentina, voseo: "anotate", "ingresá").
- Brand name, tagline and nav live in `src/lib/site.ts`.
- Design tokens are in `src/app/globals.css` (`noche`, `oro`, `pista` scales + semantic `primary`, `surface`, `muted`, `accent`...). Prefer semantic tokens. Headings use `font-display` (Barlow Condensed, uppercase).
- Base components are in `src/components/ui/`. Reuse them (and `cn()` from `@/lib/utils`) instead of repeating class strings. `/ui` renders the design system.
- All data reads go through `src/lib/data.ts`. Without Supabase env vars it falls back to `src/lib/demo-data.ts`; keep `supabase/seed.sql` in sync with it.
- Supabase clients: `@/lib/supabase/server` (server) and `@/lib/supabase/client` (client components). Use `supabase.auth.getClaims()` for auth checks.
- Session refresh and protected routes: `src/proxy.ts` → `src/lib/supabase/proxy.ts`. Still verify auth inside pages and Server Actions.
- Schema changes: new file in `supabase/migrations/` with RLS policies, then update `src/types/database.types.ts`.
- Verify with `npm run lint`, `npm run typecheck` and `npm run build`.
