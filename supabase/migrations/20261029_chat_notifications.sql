begin;
create table public.support_reads (
 user_id uuid not null references auth.users(id) on delete cascade,
 thread_id uuid not null references public.support_threads(id) on delete cascade,
 last_read_at timestamptz not null,
 last_read_id uuid not null,
 primary key(user_id,thread_id)
);
alter table public.support_reads enable row level security;
revoke all on public.support_reads from anon,authenticated;
grant select on public.support_reads to authenticated;
create policy own_read_marker on public.support_reads for select to authenticated using(user_id=auth.uid());
-- Own marker only; the target message must be readable by the caller.
create function public.mark_support_read(p_message_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare m public.support_messages;
begin
 select sm.* into m from public.support_messages sm join public.support_threads t on t.id=sm.thread_id
 where sm.id=p_message_id and (t.buyer_id=auth.uid() or public.chat_is_admin());
 if m.id is null then raise exception 'Message unavailable' using errcode='42501'; end if;
 insert into public.support_reads(user_id,thread_id,last_read_at,last_read_id)
 values(auth.uid(),m.thread_id,m.created_at,m.id)
 on conflict(user_id,thread_id) do update set last_read_at=excluded.last_read_at,last_read_id=excluded.last_read_id
 where (support_reads.last_read_at,support_reads.last_read_id)<(excluded.last_read_at,excluded.last_read_id);
end $$;
revoke all on function public.mark_support_read(uuid) from public;
grant execute on function public.mark_support_read(uuid) to authenticated;
create function public.support_inbox() returns table(
 id uuid,buyer_id uuid,buyer_name text,created_at timestamptz,
 last_message_id uuid,last_body text,last_sender_id uuid,last_message_at timestamptz,unread_count bigint
) language sql stable security invoker set search_path='' as $$
 select t.id,t.buyer_id,t.buyer_name,t.created_at,m.id,left(m.body,120),m.sender_id,m.created_at,
 (select count(*) from public.support_messages sm where sm.thread_id=t.id and sm.sender_id<>auth.uid()
 and (r.last_read_at is null or (sm.created_at,sm.id)>(r.last_read_at,r.last_read_id)))
 from public.support_threads t
 left join public.support_reads r on r.thread_id=t.id and r.user_id=auth.uid()
 left join lateral(select * from public.support_messages where thread_id=t.id order by created_at desc,id desc limit 1) m on true
 order by coalesce(m.created_at,t.created_at) desc,t.id limit 500
$$;
revoke all on function public.support_inbox() from public;
grant execute on function public.support_inbox() to authenticated;
commit;
