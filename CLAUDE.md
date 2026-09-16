@AGENTS.md

# PaddleAmerica · Pádel regional

Regional padel site: tournaments, player ranking and news.

## ⚠️ Pending merge: public ranking page (read before pulling or merging)

The owner works from two computers. On 2026-09-16 a redesign of the **public ranking page** made on the home computer had **not been pushed**, and this computer kept working on `main` without it (redesign, accounts and registrations, Supabase, admin panel).

**On the home computer, in this order:**

1. Commit the local ranking work first, then `git pull origin main` and resolve conflicts with the rules below.
2. `npm install`: this computer added `read-excel-file` and `write-excel-file`.
3. Create `.env.local` from `.env.example`. It is not in git; the owner copies the values from the other computer or from Supabase (Project Settings → API Keys). It needs `NEXT_PUBLIC_SUPABASE_URL=https://hqlxmtyhrldvvfdmocuq.supabase.co`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
4. Supabase CLI, only if you need migrations or `db query`:
   - `npx supabase login --token <token>`: the token is per machine, and it needs the permissions listed in the README.
   - `npx supabase link --project-ref hqlxmtyhrldvvfdmocuq -p "<db password>"`.

   All migrations in `supabase/migrations/` are **already applied** to the hosted project. Don't re-run or edit them.

When those two histories meet (a `git pull` with conflicts, or a merge):

- **The home computer's ranking wins.** For the public ranking UI, keep the home version: `src/app/jugadores/page.tsx` there. Here that page moved to `src/app/jugadores/(ranking)/page.tsx` (a route group so its `loading.tsx` doesn't turn missing player slugs into soft 404s). Also keep the home versions of `ranking-list.tsx` and `ranking-table.tsx` if they exist. Put the home page at the `(ranking)/` path, or delete the route group and its `loading.tsx`.
- **But keep the ranking trends from this computer:** the owner asked for them on 2026-09-16. `getRankingTrends(players)` in `data.ts` returns, per player, the points won in the last 30 days and the positions climbed in the last 7. Here the list and table render them with `ClimbBadge` (green arrow to the right of the name) and `PointsGain` ("+23 último mes" under the points) from `src/components/ranking-trend.tsx`. The home page (`src/app/page.tsx`) also passes `trends`. Add them back to the home versions.
- `src/components/ranking-court.tsx` was a stand-in built here from `public/imagen hero test 1.png`. Delete it if the home version doesn't use it. **Keep `src/assets/cancha-aerea.webp`**: the home hero uses it as the default background.
- **Keep everything else from this computer:** Supabase migrations, `src/lib/data.ts` (`getRanking({ gender, category })` and the admin reads), auth, registrations, the admin panel (`src/app/admin`), header and footer, and the other pages. If the home ranking needs different data, adapt `data.ts` or add a migration. Don't revert.
- If the home version changed the `players` table, write a new migration. Never edit the already-applied ones.
- After merging, run `npm run lint`, `npm run typecheck` and `npm run build`, check `/jugadores` and `/admin/jugadores`, then **delete this section**.

## Project status (2026-09-16)

- **Production:** https://paddleamerica.vercel.app, deployed by Vercel on every push to `main`. The `NEXT_PUBLIC_*` env vars there must be type **Config**, not Secret, or the build doesn't see Supabase.
- **Supabase:** project `hqlxmtyhrldvvfdmocuq` (São Paulo), with the example data from `supabase/seed.sql`.
  - Auth → URL Configuration must list `http://localhost:3000/**` and `https://paddleamerica.vercel.app/**`.
- **Email:** "Confirm email" is **OFF** and there is no custom SMTP yet. The plan is Resend once the domain is bought (around the end of September 2026); steps are in the README "Emails" section. Turn Confirm email back ON only after SMTP works. The password-recovery email flow is untested.
- **Admins:** `sofiher149@gmail.com` is a provisional admin. The site owner's email will be added later with `update public.profiles set is_admin = true where email = '...'`. Test accounts were deleted.
- **Hosting:** the owner may move to Hostinger. It needs a Node.js web app plan, because this app can't be a static export.

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
