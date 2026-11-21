-- ATR'S MARKET schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;
create type pricing_type as enum ('free','paid');
create type purchase_status as enum ('pending','paid','failed','refunded');

create table admin_roles (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz default now());
create or replace function is_admin() returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from admin_roles where user_id = auth.uid()) $$;

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (char_length(full_name) <= 100), avatar_url text,
  created_at timestamptz default now(), updated_at timestamptz default now());
create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as
$$ begin insert into profiles(id, full_name) values (new.id, new.raw_user_meta_data->>'full_name'); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'), created_at timestamptz default now());

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text not null default '', category_id uuid references categories(id) on delete set null,
  logo_url text, version text not null default '1.0.0', file_size_bytes bigint,
  release_date date default current_date, system_requirements text, changelog text,
  pricing pricing_type not null default 'free',
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'usd' check (char_length(currency)=3),
  is_published boolean not null default false, is_featured boolean not null default false,
  download_count integer not null default 0,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  constraint paid_needs_price check (pricing='free' or price_cents >= 50));
create index on products(is_published, created_at desc);
create index on products(category_id);
create index on products using gin (to_tsvector('simple', name || ' ' || description));

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  path text not null, sort_order int default 0, created_at timestamptz default now());
create index on product_images(product_id);

create table product_files (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  path text not null unique, version text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 2147483648),
  is_current boolean not null default true, created_at timestamptz default now());
create index on product_files(product_id, is_current);
create unique index one_current_file on product_files(product_id) where is_current;

create table purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  product_id uuid not null references products(id) on delete restrict,
  amount_cents integer not null check (amount_cents >= 0), currency text not null,
  status purchase_status not null default 'pending',
  stripe_session_id text unique, stripe_payment_intent text,
  created_at timestamptz default now(), paid_at timestamptz);
create index on purchases(user_id, status);
create index on purchases(product_id);
create unique index one_paid_per_user_product on purchases(user_id, product_id) where status='paid';

create table webhook_events (id text primary key, type text, received_at timestamptz default now()); -- duplicate protection

create table download_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  product_id uuid not null references products(id) on delete cascade,
  file_id uuid references product_files(id) on delete set null, created_at timestamptz default now());
create index on download_logs(user_id, created_at desc);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  rating int not null check (rating between 1 and 5), body text check (char_length(body) <= 2000),
  created_at timestamptz default now(), unique(user_id, product_id));

create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create trigger t1 before update on products for each row execute function touch_updated_at();
create trigger t2 before update on profiles for each row execute function touch_updated_at();

-- RLS
alter table admin_roles enable row level security; alter table profiles enable row level security;
alter table categories enable row level security; alter table products enable row level security;
alter table product_images enable row level security; alter table product_files enable row level security;
alter table purchases enable row level security; alter table webhook_events enable row level security;
alter table download_logs enable row level security; alter table reviews enable row level security;

create policy "admin_roles self read" on admin_roles for select using (user_id = auth.uid());
create policy "profile read own/admin" on profiles for select using (id = auth.uid() or is_admin());
create policy "profile update own" on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "categories public read" on categories for select using (true);
create policy "categories admin write" on categories for all using (is_admin()) with check (is_admin());
create policy "products public read" on products for select using (is_published or is_admin());
create policy "products admin write" on products for all using (is_admin()) with check (is_admin());
create policy "images public read" on product_images for select
  using (exists(select 1 from products p where p.id=product_id and (p.is_published or is_admin())));
create policy "images admin write" on product_images for all using (is_admin()) with check (is_admin());
-- file metadata (paths) is admin-only; users get files ONLY through get-download-url
create policy "files admin only" on product_files for all using (is_admin()) with check (is_admin());
-- purchases: users read own; NO client insert/update (only service role via webhook)
create policy "purchases read own/admin" on purchases for select using (user_id = auth.uid() or is_admin());
create policy "downloads read own/admin" on download_logs for select using (user_id = auth.uid() or is_admin());
create policy "reviews public read" on reviews for select using (true);
create policy "reviews insert own purchased" on reviews for insert with check (
  user_id = auth.uid() and exists(select 1 from purchases where user_id=auth.uid() and product_id=reviews.product_id and status='paid')
  or user_id = auth.uid() and exists(select 1 from products where id=reviews.product_id and pricing='free'));
create policy "reviews modify own" on reviews for update using (user_id=auth.uid());
create policy "reviews delete own/admin" on reviews for delete using (user_id=auth.uid() or is_admin());
-- webhook_events: no policies = service role only

-- Admin stats
create function admin_stats() returns json language sql stable security definer set search_path=public as $$
 select case when is_admin() then json_build_object(
  'products',(select count(*) from products),'users',(select count(*) from profiles),
  'purchases',(select count(*) from purchases where status='paid'),
  'downloads',(select count(*) from download_logs),
  'revenue_cents',(select coalesce(sum(amount_cents),0) from purchases where status='paid'),
  'storage_bytes',(select coalesce(sum(size_bytes),0) from product_files)) end $$;

-- Storage: images public, files private (no public policy => only service role / admin)
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('product-images','product-images',true,5242880,array['image/png','image/jpeg','image/webp']),
 ('product-files','product-files',false,2147483648,null) on conflict do nothing;
create policy "images public read" on storage.objects for select using (bucket_id='product-images');
create policy "images admin write" on storage.objects for all using (bucket_id='product-images' and is_admin()) with check (bucket_id='product-images' and is_admin());
create policy "files admin only" on storage.objects for all using (bucket_id='product-files' and is_admin()) with check (bucket_id='product-files' and is_admin());

-- After signing up, make yourself admin:
-- insert into admin_roles(user_id) select id from auth.users where email='YOU@EMAIL.COM';

create function increment_downloads(pid uuid) returns void language sql security definer set search_path=public as
$$ update products set download_count = download_count + 1 where id = pid $$;
revoke execute on function increment_downloads(uuid) from public, anon, authenticated;
