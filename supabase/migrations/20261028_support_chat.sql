-- Website support chat. Execute in the connected Supabase project's SQL Editor.
begin;
create or replace function public.chat_is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;
revoke all on function public.chat_is_admin() from public;
grant execute on function public.chat_is_admin() to authenticated;

create table if not exists public.support_threads (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null unique references auth.users(id) on delete cascade,
  buyer_name text not null check (char_length(buyer_name) between 1 and 80),
  created_at timestamptz not null default now()
);
create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists support_messages_thread_time on public.support_messages(thread_id,created_at desc,id desc);
alter table public.support_threads enable row level security;
alter table public.support_messages enable row level security;
revoke all on public.support_threads, public.support_messages from anon, authenticated;
grant select on public.support_threads, public.support_messages to authenticated;
grant insert (buyer_id,buyer_name) on public.support_threads to authenticated;
grant insert (thread_id,sender_id,body) on public.support_messages to authenticated;

create policy support_thread_read on public.support_threads for select to authenticated
using (buyer_id = auth.uid() or public.chat_is_admin());
create policy support_thread_create on public.support_threads for insert to authenticated
with check (buyer_id = auth.uid() and exists(select 1 from public.profiles where id = auth.uid() and role in ('buyer','dealer')));
create policy support_message_read on public.support_messages for select to authenticated
using (exists(select 1 from public.support_threads t where t.id = thread_id and (t.buyer_id = auth.uid() or public.chat_is_admin())));
create policy support_message_send on public.support_messages for insert to authenticated
with check (sender_id = auth.uid() and exists(select 1 from public.support_threads t where t.id = thread_id and (t.buyer_id = auth.uid() or public.chat_is_admin())));
commit;
