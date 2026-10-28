-- Existing buyer/admin accounts; never leaves test messages or read markers behind.
begin;
select set_config('test.buyer',(select id::text from public.profiles where role='buyer' limit 1),true);
select set_config('test.admin',(select id::text from public.profiles where role='admin' limit 1),true);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.buyer'),'role','authenticated')::text,true);
set local role authenticated;
do $$ declare t uuid;m uuid;begin
 if auth.uid() is null then raise exception 'Buyer required';end if;
 select id into t from public.support_threads where buyer_id=auth.uid();
 if t is null then insert into public.support_threads(buyer_id,buyer_name) values(auth.uid(),'Test rollback') returning id into t;end if;
 insert into public.support_messages(thread_id,sender_id,body) values(t,auth.uid(),'Test notification rollback') returning id into m;
 perform set_config('test.thread',t::text,true);perform set_config('test.message',m::text,true);
 if not exists(select 1 from public.support_inbox() where id=t) then raise exception 'Own inbox unavailable';end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.admin'),'role','authenticated')::text,true);
do $$ begin
 if not exists(select 1 from public.support_inbox() where id=current_setting('test.thread')::uuid and unread_count>0) then raise exception 'Missing admin unread';end if;
 perform public.mark_support_read(current_setting('test.message')::uuid);
 if exists(select 1 from public.support_inbox() where id=current_setting('test.thread')::uuid and unread_count<>0) then raise exception 'Read marker failed';end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',gen_random_uuid(),'role','authenticated')::text,true);
do $$ begin
 if exists(select 1 from public.support_inbox() where id=current_setting('test.thread')::uuid) then raise exception 'Inbox leak';end if;
 if exists(select 1 from public.support_reads where thread_id=current_setting('test.thread')::uuid) then raise exception 'Read marker leak';end if;
 begin perform public.mark_support_read(current_setting('test.message')::uuid);raise exception 'Outsider marked read';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
select 'PASS: inbox isolation, admin unread, read marker and outsider denial; all changes rolled back' as verification;
