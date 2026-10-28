begin;
-- Retain accounts and their records; remove only the obsolete role.
update public.profiles set role='buyer' where role::text='dealer';
alter table public.profiles add constraint profiles_supported_roles check(role::text in ('admin','buyer'));
create or replace function public.protect_profile_privileges() returns trigger
language plpgsql set search_path='' as $$
begin
 if auth.role() in ('anon','authenticated') then
  if TG_OP='INSERT' then
   if coalesce(NEW.role::text,'buyer')<>'buyer' or coalesce(NEW.verified,false) then
    raise exception 'Profile privileges must be assigned by an administrator';
   end if;
  elsif NEW.role is distinct from OLD.role or NEW.verified is distinct from OLD.verified then
   raise exception 'Profile privileges must be assigned by an administrator';
  end if;
 end if;
 return NEW;
end $$;
drop policy listing_create on public.marketplace_listings;
drop policy listing_edit on public.marketplace_listings;
drop policy listing_delete on public.marketplace_listings;
create policy listing_create on public.marketplace_listings for insert to authenticated with check(seller_id=auth.uid() and public.marketplace_is_admin());
create policy listing_edit on public.marketplace_listings for update to authenticated using(public.marketplace_is_admin()) with check(public.marketplace_is_admin());
create policy listing_delete on public.marketplace_listings for delete to authenticated using(public.marketplace_is_admin());
drop policy support_thread_create on public.support_threads;
create policy support_thread_create on public.support_threads for insert to authenticated with check(buyer_id=auth.uid() and exists(select 1 from public.profiles where id=auth.uid() and role='buyer'));
commit;
select count(*) as remaining_dealer_accounts from public.profiles where role::text='dealer';
