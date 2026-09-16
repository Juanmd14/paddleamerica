-- =====================================================================
-- Inscripciones a torneos
-- Cada usuario anota a su pareja en un torneo con inscripciones abiertas.
-- El organizador las ve y las confirma desde el dashboard de Supabase
-- (el service role no pasa por RLS).
-- =====================================================================

create table public.tournament_registrations (
  id bigint generated always as identity primary key,
  tournament_id bigint not null references public.tournaments (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  partner_name text not null check (char_length(partner_name) between 3 and 120),
  contact_phone text not null check (char_length(contact_phone) between 6 and 30),
  category text check (char_length(category) <= 60),
  notes text check (char_length(notes) <= 500),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'confirmada', 'cancelada')),
  created_at timestamptz not null default now(),
  constraint tournament_registrations_unique unique (tournament_id, user_id)
);

create index tournament_registrations_user_idx
  on public.tournament_registrations (user_id);

alter table public.tournament_registrations enable row level security;

create policy "Cada usuario ve sus inscripciones"
  on public.tournament_registrations for select to authenticated
  using ((select auth.uid()) = user_id);

-- Solo en torneos con inscripciones abiertas, y siempre como "pendiente".
create policy "Cada usuario se inscribe en torneos abiertos"
  on public.tournament_registrations for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'pendiente'
    and exists (
      select 1 from public.tournaments t
      where t.id = tournament_id and t.status = 'inscripciones'
    )
  );

-- Darse de baja borra la inscripción (así puede volver a anotarse),
-- mientras el torneo siga con inscripciones abiertas.
create policy "Cada usuario cancela su inscripción mientras estén abiertas"
  on public.tournament_registrations for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.tournaments t
      where t.id = tournament_id and t.status = 'inscripciones'
    )
  );

grant select, insert, delete on public.tournament_registrations to authenticated;
