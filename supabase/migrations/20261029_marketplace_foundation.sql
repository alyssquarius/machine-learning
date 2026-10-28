-- Foundation only. Existing browser data is deliberately not imported automatically.
begin;
create function public.marketplace_is_admin() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='admin')
$$;
revoke all on function public.marketplace_is_admin() from public;
grant execute on function public.marketplace_is_admin() to anon,authenticated;
create table public.marketplace_listings (
 id text primary key check(char_length(id) between 1 and 100),
 seller_id uuid not null references auth.users(id),
 title text not null check(char_length(btrim(title)) between 1 and 160),
 brand text not null default '' check(char_length(brand)<=40),
 model text not null default '' check(char_length(model)<=60),
 price bigint not null check(price between 1000000 and 10000000000),
 year integer not null check(year between 1900 and 2100),
 km integer not null default 0 check(km>=0),
 location text not null check(char_length(location) between 1 and 120),
 category text not null check(category in ('SUV','Sedan','MPV','Hatchback','Listrik','Wagon','Coupe','Van','Pickup','Lainnya')),
 status text not null default 'queued' check(status in ('queued','running','done','failed')),
 description text not null default '' check(char_length(description)<=10000),
 seller_name text not null default '' check(char_length(seller_name)<=80),
 seller_phone text not null default '' check(seller_phone ~ '^[0-9+ ()-]{0,25}$'),
 images jsonb not null default '[]' check(jsonb_typeof(images)='array' and jsonb_array_length(images)<=10),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
-- Never store offers, buyer names, addresses or purchases in this public catalogue.
create index marketplace_listings_status_created on public.marketplace_listings(status,created_at desc);
create index marketplace_listings_seller on public.marketplace_listings(seller_id);
create table public.marketplace_favorites (
 owner_id uuid not null references auth.users(id) on delete cascade,
 listing_id text not null references public.marketplace_listings(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(owner_id,listing_id)
);
create function public.guard_marketplace_listing() returns trigger
language plpgsql set search_path='' as $$
begin
 if TG_OP='UPDATE' then
  if NEW.seller_id is distinct from OLD.seller_id or NEW.id is distinct from OLD.id then
   raise exception 'Listing identity and owner cannot change';
  end if;
  NEW.created_at=OLD.created_at;
 end if;
 NEW.updated_at=now();
 return NEW;
end $$;
create trigger guard_marketplace_listing before insert or update on public.marketplace_listings
for each row execute function public.guard_marketplace_listing();
alter table public.marketplace_listings enable row level security;
alter table public.marketplace_favorites enable row level security;
revoke all on public.marketplace_listings,public.marketplace_favorites from anon,authenticated;
grant select on public.marketplace_listings to anon,authenticated;
grant insert,update,delete on public.marketplace_listings to authenticated;
grant select,insert,delete on public.marketplace_favorites to authenticated;
create policy listing_read on public.marketplace_listings for select to anon,authenticated
using(status='running' or seller_id=auth.uid() or public.marketplace_is_admin());
create policy listing_create on public.marketplace_listings for insert to authenticated
with check(seller_id=auth.uid() and exists(select 1 from public.profiles where id=auth.uid() and role in ('dealer','admin')));
create policy listing_edit on public.marketplace_listings for update to authenticated
using(exists(select 1 from public.profiles where id=auth.uid() and (role='admin' or (role='dealer' and seller_id=auth.uid()))))
with check(exists(select 1 from public.profiles where id=auth.uid() and (role='admin' or (role='dealer' and seller_id=auth.uid()))));
create policy listing_delete on public.marketplace_listings for delete to authenticated
using(exists(select 1 from public.profiles where id=auth.uid() and (role='admin' or (role='dealer' and seller_id=auth.uid()))));
create policy favorite_read on public.marketplace_favorites for select to authenticated using(owner_id=auth.uid());
create policy favorite_create on public.marketplace_favorites for insert to authenticated
with check(owner_id=auth.uid() and exists(select 1 from public.marketplace_listings where id=listing_id and status='running'));
create policy favorite_delete on public.marketplace_favorites for delete to authenticated using(owner_id=auth.uid());
commit;
