@AGENTS.md

# PaddleAmerica · Pádel regional

Regional padel site: tournaments, player ranking and news.

## Project status (2026-09-16)

- **Production:** https://paddleamerica.vercel.app, deployed by Vercel on every push to `main`. The `NEXT_PUBLIC_*` env vars there must be type **Config**, not Secret, or the build doesn't see Supabase.
- **Supabase:** project `hqlxmtyhrldvvfdmocuq` (São Paulo), with the example data from `supabase/seed.sql`.
  - Auth → URL Configuration must list `http://localhost:3000/**` and `https://paddleamerica.vercel.app/**`.
- **Email:** "Confirm email" is **OFF** and there is no custom SMTP yet. The plan is Resend once the domain is bought (around the end of September 2026); steps are in the README "Emails" section. Turn Confirm email back ON only after SMTP works. The password-recovery email flow is untested.
- **Admins:** `sofiher149@gmail.com` is admin and stays admin. `agustinjampi@gmail.com` (the owner) signed up on 2026-09-17 and will also be admin, made from **Panel → Usuarios → his page → Hacer admin** (`set_profile_admin`). `sofiher149+prueba@gmail.com` ("Robertito") is a test account.
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
- Categories are numbers from 1 to 8 (1 = 1ra), stored in `profiles.category` (assigned only by an admin in `/admin/usuarios` through `set_profile_category`; users have no update grant on it) and in `tournaments.category_min`/`category_max` (a range) or `category_sum` (the pair's minimum sum). `tournaments.category` is only the display label, which the admin form generates. The rules live in `src/lib/categories.ts` and in the SQL function `pair_category_error`. Keep both in sync.
- `players.active = false` means the player no longer competes: public reads (`getRanking`, `getCategoryCounts`, `getRankingPosition`, stats) skip them; admin reads pass `includeInactive: true`. Admins delete accounts with `delete_user_account` (never admins or accounts with registrations in unfinished tournaments).
- `tournaments.registration_opens_at` (timestamptz): a pg_cron job (`abrir-inscripciones`, every minute) runs `open_scheduled_registrations()` and moves `proximo` tournaments to `inscripciones` once that time passes. Admin inputs are Argentina time (`fromDateTimeLocal` / `toDateTimeLocal`).
- Registrations are made in pairs. A player invites a partner by `@username` with `register_pair`, the partner answers with `respond_invitation`, and either of them cancels with `cancel_registration`. Authenticated users have no insert or delete grants on `tournament_registrations`, so always go through those functions. An admin can confirm a registration only after the partner accepts.
- A trigger logs every change to `players.ranking_points` in `player_point_changes`. To record a reason, SQL functions call `set_config('app.points_reason', ..., true)` first. Admin corrections go through `adjust_player_points`.
- Dialogs use `Modal` (`src/components/ui/modal.tsx`, a native `<dialog>`). `variant="sheet"` makes it slide up from the bottom on phones.
- Verify with `npm run lint`, `npm run typecheck` and `npm run build`.
