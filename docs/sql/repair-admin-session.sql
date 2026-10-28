-- Targeted repair for the account explicitly identified by the owner.
-- Preserve avatar in profiles before removing its duplicate from Auth metadata.
-- Role assignment requires the owner's explicit confirmation before execution.
begin;
update public.profiles p
set avatar_url = coalesce(nullif(p.avatar_url, ''), u.raw_user_meta_data->>'avatar_url'),
    updated_at = now()
from auth.users u
where p.id = u.id and u.email = 'admin@autobuycars.com'
  and u.raw_user_meta_data->>'avatar_url' like 'data:%';
update auth.users
set raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{avatar_url}', 'null'::jsonb)
where email = 'admin@autobuycars.com'
  and raw_user_meta_data->>'avatar_url' like 'data:%';
-- Execute the following only after the owner confirms the admin assignment:
update public.profiles p set role = 'admin', updated_at = now()
from auth.users u where p.id = u.id and u.email = 'admin@autobuycars.com';
commit;
select u.email, octet_length(u.raw_user_meta_data::text) as auth_metadata_bytes,
       p.role, length(p.avatar_url) as preserved_avatar_chars
from auth.users u join public.profiles p on p.id = u.id
where u.email = 'admin@autobuycars.com';
