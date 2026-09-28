-- ═══════════════════════════════════════════════════════════════
--  The Agratha Academy — website CMS schema
--  All objects are prefixed "aa_" so they can live alongside other
--  apps in the same Supabase project without colliding.
--
--  Re-runnable: every statement is idempotent.
-- ═══════════════════════════════════════════════════════════════

-- ── Admins ─────────────────────────────────────────────────────
-- aa_admin_invites : e-mail addresses allowed to become admins
-- aa_admins        : signed-in users who have claimed an invite
create table if not exists public.aa_admin_invites (
  email       text primary key check (email = lower(email)),
  invited_at  timestamptz not null default now(),
  invited_by  uuid references auth.users (id) on delete set null
);

create table if not exists public.aa_admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  created_at  timestamptz not null default now()
);

create or replace function public.aa_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.aa_admins where user_id = (select auth.uid())
  );
$$;

-- Called by the admin panel after login. If the signed-in user's
-- (confirmed) e-mail is on the invite list, they become an admin.
create or replace function public.aa_claim_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
begin
  if v_uid is null then
    return false;
  end if;

  select lower(u.email) into v_email
  from auth.users u
  where u.id = v_uid and u.email_confirmed_at is not null;

  if v_email is null then
    return false;
  end if;

  if exists (select 1 from public.aa_admin_invites i where i.email = v_email) then
    insert into public.aa_admins (user_id, email)
    values (v_uid, v_email)
    on conflict (user_id) do nothing;
  end if;

  return exists (select 1 from public.aa_admins a where a.user_id = v_uid);
end;
$$;

revoke all on function public.aa_claim_admin() from public, anon;
grant execute on function public.aa_claim_admin() to authenticated;
grant execute on function public.aa_is_admin() to anon, authenticated;

-- ── Shared updated_at trigger ─────────────────────────────────
create or replace function public.aa_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ── Site settings (key → JSON document) ───────────────────────
-- keys: 'site' (header, nav, footer, contact, SEO)
--       'disclosure' (disclosure page header / sidebar / footer)
create table if not exists public.aa_settings (
  key         text primary key,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ── Page sections ─────────────────────────────────────────────
create table if not exists public.aa_sections (
  id          uuid primary key default gen_random_uuid(),
  page        text not null default 'home' check (page in ('home', 'disclosure')),
  type        text not null,
  anchor      text,
  label       text,
  position    integer not null default 0,
  visible     boolean not null default true,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
create index if not exists aa_sections_page_position_idx
  on public.aa_sections (page, position);

-- ── Announcements (pop-up, scrolling ticker, notice board) ────
create table if not exists public.aa_announcements (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  body           text,
  image_url      text,
  link_url       text,
  link_label     text,
  show_popup     boolean not null default false,
  show_ticker    boolean not null default true,
  show_on_board  boolean not null default true,
  active         boolean not null default true,
  pinned         boolean not null default false,
  starts_at      timestamptz,
  ends_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['aa_settings', 'aa_sections', 'aa_announcements'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format(
      'create trigger %I before update on public.%I
         for each row execute function public.aa_touch_updated_at()',
      t || '_touch', t);
  end loop;
end $$;

-- ── Row level security ────────────────────────────────────────
alter table public.aa_admin_invites  enable row level security;
alter table public.aa_admins         enable row level security;
alter table public.aa_settings       enable row level security;
alter table public.aa_sections       enable row level security;
alter table public.aa_announcements  enable row level security;

-- invites / admins: only admins can see or change them
drop policy if exists aa_admin_invites_admin_all on public.aa_admin_invites;
create policy aa_admin_invites_admin_all on public.aa_admin_invites
  for all to authenticated
  using ((select public.aa_is_admin()))
  with check ((select public.aa_is_admin()));

drop policy if exists aa_admins_admin_select on public.aa_admins;
create policy aa_admins_admin_select on public.aa_admins
  for select to authenticated
  using ((select public.aa_is_admin()));

drop policy if exists aa_admins_admin_delete on public.aa_admins;
create policy aa_admins_admin_delete on public.aa_admins
  for delete to authenticated
  using ((select public.aa_is_admin()) and user_id <> (select auth.uid()));

-- settings: public read, admin write
drop policy if exists aa_settings_public_read on public.aa_settings;
create policy aa_settings_public_read on public.aa_settings
  for select to anon, authenticated
  using (true);

drop policy if exists aa_settings_admin_insert on public.aa_settings;
create policy aa_settings_admin_insert on public.aa_settings
  for insert to authenticated
  with check ((select public.aa_is_admin()));

drop policy if exists aa_settings_admin_update on public.aa_settings;
create policy aa_settings_admin_update on public.aa_settings
  for update to authenticated
  using ((select public.aa_is_admin()))
  with check ((select public.aa_is_admin()));

drop policy if exists aa_settings_admin_delete on public.aa_settings;
create policy aa_settings_admin_delete on public.aa_settings
  for delete to authenticated
  using ((select public.aa_is_admin()));

-- sections: public sees visible ones, admins see everything
drop policy if exists aa_sections_read on public.aa_sections;
create policy aa_sections_read on public.aa_sections
  for select to anon, authenticated
  using (visible or (select public.aa_is_admin()));

drop policy if exists aa_sections_admin_insert on public.aa_sections;
create policy aa_sections_admin_insert on public.aa_sections
  for insert to authenticated
  with check ((select public.aa_is_admin()));

drop policy if exists aa_sections_admin_update on public.aa_sections;
create policy aa_sections_admin_update on public.aa_sections
  for update to authenticated
  using ((select public.aa_is_admin()))
  with check ((select public.aa_is_admin()));

drop policy if exists aa_sections_admin_delete on public.aa_sections;
create policy aa_sections_admin_delete on public.aa_sections
  for delete to authenticated
  using ((select public.aa_is_admin()));

-- announcements: public sees live ones, admins see everything
drop policy if exists aa_announcements_read on public.aa_announcements;
create policy aa_announcements_read on public.aa_announcements
  for select to anon, authenticated
  using (
    (active
      and (starts_at is null or starts_at <= now())
      and (ends_at   is null or ends_at   >  now()))
    or (select public.aa_is_admin())
  );

drop policy if exists aa_announcements_admin_insert on public.aa_announcements;
create policy aa_announcements_admin_insert on public.aa_announcements
  for insert to authenticated
  with check ((select public.aa_is_admin()));

drop policy if exists aa_announcements_admin_update on public.aa_announcements;
create policy aa_announcements_admin_update on public.aa_announcements
  for update to authenticated
  using ((select public.aa_is_admin()))
  with check ((select public.aa_is_admin()));

drop policy if exists aa_announcements_admin_delete on public.aa_announcements;
create policy aa_announcements_admin_delete on public.aa_announcements
  for delete to authenticated
  using ((select public.aa_is_admin()));

-- ── Media storage bucket ──────────────────────────────────────
-- Public bucket: files are readable by URL; only admins can list,
-- upload, replace or delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'agratha-media', 'agratha-media', true, 52428800,
  array['image/*', 'video/*', 'application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists aa_media_admin_select on storage.objects;
create policy aa_media_admin_select on storage.objects
  for select to authenticated
  using (bucket_id = 'agratha-media' and (select public.aa_is_admin()));

drop policy if exists aa_media_admin_insert on storage.objects;
create policy aa_media_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'agratha-media' and (select public.aa_is_admin()));

drop policy if exists aa_media_admin_update on storage.objects;
create policy aa_media_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'agratha-media' and (select public.aa_is_admin()))
  with check (bucket_id = 'agratha-media' and (select public.aa_is_admin()));

drop policy if exists aa_media_admin_delete on storage.objects;
create policy aa_media_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'agratha-media' and (select public.aa_is_admin()));
