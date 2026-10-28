-- Prevent a browser/client or old code from reintroducing large avatars into JWTs.
-- Existing avatars must first be copied to profiles/Storage and removed from
-- Auth metadata separately; this trigger does not modify existing records.
begin;
create or replace function public.guard_auth_inline_avatar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(NEW.raw_user_meta_data->>'avatar_url', '') like 'data:%' then
    raise exception 'Store avatar images in profiles or Storage, not Auth metadata';
  end if;
  return NEW;
end;
$$;
drop trigger if exists guard_auth_inline_avatar on auth.users;
create trigger guard_auth_inline_avatar
before insert or update of raw_user_meta_data on auth.users
for each row execute function public.guard_auth_inline_avatar();
commit;
