-- Runs against existing admin/buyer profiles; all test messages are rolled back.
begin;
select set_config('test.buyer', (select id::text from public.profiles where role='buyer' limit 1), true);
select set_config('test.admin', (select id::text from public.profiles where role='admin' limit 1), true);
select set_config('request.jwt.claims', json_build_object('sub',current_setting('test.buyer'),'role','authenticated')::text,true);
set local role authenticated;
do $$
declare thread uuid;
begin
  if auth.uid() is null then raise exception 'An existing buyer profile is required'; end if;
  insert into public.support_threads(buyer_id,buyer_name) values(auth.uid(),'Uji chat sementara') returning id into thread;
  perform set_config('test.thread',thread::text,true);
  insert into public.support_messages(thread_id,sender_id,body) values(thread,auth.uid(),'Pesan uji buyer - rollback');
  if (select count(*) from public.support_messages where thread_id=thread) <> 1 then raise exception 'Buyer cannot read own message'; end if;
  begin
    insert into public.support_messages(thread_id,sender_id,body) values(thread,current_setting('test.admin')::uuid,'Forged sender');
    raise exception 'Sender impersonation was allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.support_messages(thread_id,sender_id,body) values(thread,auth.uid(),repeat('x',2001));
    raise exception 'Oversized message was allowed';
  exception when check_violation then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',gen_random_uuid(),'role','authenticated')::text,true);
do $$ begin
 if exists(select 1 from public.support_threads where id=current_setting('test.thread')::uuid) then raise exception 'Other buyer could read thread'; end if;
 if exists(select 1 from public.support_messages where thread_id=current_setting('test.thread')::uuid) then raise exception 'Other buyer could read messages'; end if;
 begin
  insert into public.support_messages(thread_id,sender_id,body) values(current_setting('test.thread')::uuid,auth.uid(),'Unauthorized');
  raise exception 'Other buyer could send';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.admin'),'role','authenticated')::text,true);
do $$ begin
 if not public.chat_is_admin() then raise exception 'Admin recognition failed'; end if;
 if (select count(*) from public.support_messages where thread_id=current_setting('test.thread')::uuid) <> 1 then raise exception 'Admin cannot read'; end if;
 insert into public.support_messages(thread_id,sender_id,body) values(current_setting('test.thread')::uuid,auth.uid(),'Balasan admin uji - rollback');
 if (select count(*) from public.support_messages where thread_id=current_setting('test.thread')::uuid) <> 2 then raise exception 'Admin cannot reply'; end if;
 begin
  update public.support_messages set body='mutated' where thread_id=current_setting('test.thread')::uuid;
  raise exception 'Message update was allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: buyer send/read, admin reply/read, outsider blocked, spoof/oversize/update blocked. All test data rolled back.' as verification;
