-- LOOTLAB affiliate short links for the existing Deal Dhamaka Supabase project.
-- Run once in Supabase Dashboard > SQL Editor. No service-role key is used in the app.
create table if not exists public.dd_lootlab_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.dd_workspaces(id) on delete cascade,
  slug text not null unique,
  label text,
  original_url text not null,
  created_by uuid not null references auth.users(id),
  click_count bigint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_clicked_at timestamptz
);
create index if not exists dd_lootlab_links_workspace_created_idx
  on public.dd_lootlab_links(workspace_id, created_at desc);
alter table public.dd_lootlab_links enable row level security;
drop policy if exists dd_lootlab_member_select on public.dd_lootlab_links;
create policy dd_lootlab_member_select on public.dd_lootlab_links
  for select to authenticated using (public.dd_is_workspace_member(workspace_id));
drop policy if exists dd_lootlab_member_insert on public.dd_lootlab_links;
create policy dd_lootlab_member_insert on public.dd_lootlab_links
  for insert to authenticated with check (
    public.dd_is_workspace_member(workspace_id) and created_by = auth.uid()
  );
drop policy if exists dd_lootlab_member_update on public.dd_lootlab_links;
create policy dd_lootlab_member_update on public.dd_lootlab_links
  for update to authenticated using (public.dd_is_workspace_member(workspace_id))
  with check (public.dd_is_workspace_member(workspace_id));
drop policy if exists dd_lootlab_member_delete on public.dd_lootlab_links;
create policy dd_lootlab_member_delete on public.dd_lootlab_links
  for delete to authenticated using (public.dd_is_workspace_member(workspace_id));

create or replace function public.dd_lootlab_resolve(p_slug text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_url text;
begin
  update public.dd_lootlab_links
     set click_count = click_count + 1, last_clicked_at = now()
   where slug = p_slug and is_active = true
   returning original_url into v_url;
  return v_url;
end;
$$;
revoke all on function public.dd_lootlab_resolve(text) from public;
grant execute on function public.dd_lootlab_resolve(text) to anon, authenticated;
grant select, insert, update, delete on public.dd_lootlab_links to authenticated;
