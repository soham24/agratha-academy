-- ═══════════════════════════════════════════════════════════════
--  Version history for the website CMS.
--  Every change to a section or to site settings stores the previous
--  version here, so admins can restore earlier text or bring back a
--  deleted section. Only admins can read it; rows are written by the
--  trigger only. The newest 30 versions per item are kept.
--
--  Re-runnable: every statement is idempotent.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.aa_revisions (
  id          bigint generated always as identity primary key,
  target      text not null check (target in ('section', 'settings')),
  target_id   text not null,
  page        text,
  action      text not null check (action in ('update', 'delete')),
  row         jsonb not null,
  created_at  timestamptz not null default now(),
  created_by  uuid default auth.uid()
);
create index if not exists aa_revisions_target_idx
  on public.aa_revisions (target, target_id, id desc);
create index if not exists aa_revisions_deleted_idx
  on public.aa_revisions (action, page, id desc);

alter table public.aa_revisions enable row level security;

drop policy if exists aa_revisions_admin_select on public.aa_revisions;
create policy aa_revisions_admin_select on public.aa_revisions
  for select to authenticated
  using ((select public.aa_is_admin()));

create or replace function public.aa_record_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Read fields via JSON: aa_sections has id/page, aa_settings has key.
  v_old       jsonb := to_jsonb(old);
  v_target    text := case when tg_table_name = 'aa_sections' then 'section' else 'settings' end;
  v_target_id text := coalesce(v_old->>'id', v_old->>'key');
  v_page      text := v_old->>'page';
  v_action    text := lower(tg_op);
begin
  -- Re-ordering sections is not worth a version.
  if tg_op = 'UPDATE' and v_old - 'position' - 'updated_at' = to_jsonb(new) - 'position' - 'updated_at' then
    return new;
  end if;

  insert into public.aa_revisions (target, target_id, page, action, row)
  values (v_target, v_target_id, v_page, v_action, v_old);

  delete from public.aa_revisions r
  where r.target = v_target and r.target_id = v_target_id and r.action = 'update'
    and r.id not in (
      select r2.id from public.aa_revisions r2
      where r2.target = v_target and r2.target_id = v_target_id and r2.action = 'update'
      order by r2.id desc limit 30
    );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function public.aa_record_revision() from public, anon, authenticated;

drop trigger if exists aa_sections_revision on public.aa_sections;
create trigger aa_sections_revision
  after update or delete on public.aa_sections
  for each row execute function public.aa_record_revision();

drop trigger if exists aa_settings_revision on public.aa_settings;
create trigger aa_settings_revision
  after update or delete on public.aa_settings
  for each row execute function public.aa_record_revision();
