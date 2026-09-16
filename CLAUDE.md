@AGENTS.md

# PaddleAmerica · Pádel regional

Regional padel site: tournaments, player ranking and news.

## ⚠️ Pending merge: public ranking page (read before pulling or merging)

The owner works from two computers. On 2026-09-16 a redesign of the **public ranking page** made on the home computer had **not been pushed**, and this computer kept working on `main` without it (redesign, accounts and registrations, Supabase, admin panel).

When those two histories meet (a `git pull` with conflicts, or a merge):

- **The home computer's ranking wins.** For the public ranking UI, keep the home version: `src/app/jugadores/page.tsx` there. Here that page moved to `src/app/jugadores/(ranking)/page.tsx` (a route group so its `loading.tsx` doesn't turn missing player slugs into soft 404s). Also keep the home versions of `ranking-list.tsx` and `ranking-table.tsx` if they exist. Put the home page at the `(ranking)/` path, or delete the route group and its `loading.tsx`.
- `src/components/ranking-court.tsx` and `src/assets/ranking-cancha.webp` were a stand-in built here from `public/imagen hero test 1.png`. Delete them if the home version doesn't use them.
- **Keep everything else from this computer:** Supabase migrations, `src/lib/data.ts` (`getRanking({ gender, category })` and the admin reads), auth, registrations, the admin panel (`src/app/admin`), header and footer, and the other pages. If the home ranking needs different data, adapt `data.ts` or add a migration. Don't revert.
- If the home version changed the `players` table, write a new migration. Never edit the already-applied ones.
- After merging, run `npm run lint`, `npm run typecheck` and `npm run build`, check `/jugadores` and `/admin/jugadores`, then **delete this section**.

- UI text is in Spanish (Argentina, voseo: "anotate", "ingresá").
- Brand name, tagline and nav live in `src/lib/site.ts`.
- Design tokens are in `src/app/globals.css` (`noche`, `oro`, `pista` scales + semantic `primary`, `surface`, `muted`, `accent`...). Prefer semantic tokens. Headings use `font-display` (Barlow Condensed, uppercase).
- Base components are in `src/components/ui/` (Button, Badge, Card, Input/Textarea/FieldError, Alert, Avatar, Skeleton, Container). Reuse them (and `cn()` from `@/lib/utils`) instead of repeating class strings. `/ui` renders the design system (dev only).
- All data reads go through `src/lib/data.ts`. Without Supabase env vars it falls back to `src/lib/demo-data.ts`; keep `supabase/seed.sql` in sync with it.
- Supabase clients: `@/lib/supabase/server` (server) and `@/lib/supabase/client` (client components). Use `getCurrentUser()` from `@/lib/auth` (wraps `supabase.auth.getClaims()`, memoized per request) for auth checks.
- Session refresh and protected routes: `src/proxy.ts` → `src/lib/supabase/proxy.ts`. Still verify auth inside pages and Server Actions.
- Admin panel lives in `src/app/admin`. Call `requireAdmin()` from `@/lib/auth` at the top of **every** admin page, route handler (use `getCurrentUser()` and return 404) and Server Action; the layout is visual only. Admin reads also go through `src/lib/data.ts`. Admin forms use `useAdminForm` (no React form reset) and `ImageUpload` (Storage bucket `media`).
- Schema changes: new file in `supabase/migrations/` with RLS policies, apply with `npx supabase db push`, then `npm run db:types`. Never edit an applied migration.
- Verify with `npm run lint`, `npm run typecheck` and `npm run build`.
