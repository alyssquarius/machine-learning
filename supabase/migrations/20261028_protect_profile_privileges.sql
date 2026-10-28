-- Run after supabase-setup-avatars.sql. This migration does not modify existing data.
-- Keep the own-profile RLS policies enabled; this trigger also prevents direct REST
-- clients from changing admin/verification fields despite permissive own-row UPDATE.
begin;

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.role() in ('anon', 'authenticated') then
    if TG_OP = 'INSERT' then
      if coalesce(NEW.role, 'buyer') not in ('buyer', 'dealer')
         or coalesce(NEW.verified, false) then
        raise exception 'Profile privileges must be assigned by an administrator';
      end if;
    else
      if ((NEW.role = 'admin' or OLD.role = 'admin') and NEW.role is distinct from OLD.role)
         or NEW.verified is distinct from OLD.verified then
        raise exception 'Profile privileges must be assigned by an administrator';
      end if;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
before insert or update on public.profiles
for each row execute function public.protect_profile_privileges();

commit;
