-- Atomic behaviour checks. Each attempted write occurs inside an exception
-- subtransaction and is rolled back. Any missing guard aborts the entire DO.
do $$
declare target_id uuid;
begin
  select id into strict target_id from auth.users where email = 'admin@autobuycars.com';
  perform set_config('request.jwt.claims', jsonb_build_object('role', 'authenticated', 'sub', target_id)::text, true);
  begin
    update public.profiles set role = 'buyer' where id = target_id;
    raise exception 'TEST_FAILED_ROLE_GUARD';
  exception when others then
    if SQLERRM <> 'Profile privileges must be assigned by an administrator' then raise; end if;
  end;
  begin
    update public.profiles set verified = not coalesce(verified, false) where id = target_id;
    raise exception 'TEST_FAILED_VERIFICATION_GUARD';
  exception when others then
    if SQLERRM <> 'Profile privileges must be assigned by an administrator' then raise; end if;
  end;
  begin
    update auth.users set raw_user_meta_data = jsonb_set(raw_user_meta_data, '{avatar_url}', '"data:image/png;base64,test"'::jsonb) where id = target_id;
    raise exception 'TEST_FAILED_AVATAR_GUARD';
  exception when others then
    if SQLERRM <> 'Store avatar images in profiles or Storage, not Auth metadata' then raise; end if;
  end;
end $$;
