-- Run after 001-006.
create table donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  amount_cents integer not null check (amount_cents between 100 and 100000),
  currency text not null default 'usd',
  message text check (char_length(message) <= 300),
  status purchase_status not null default 'pending',
  paddle_txn_id text unique,
  created_at timestamptz default now(), paid_at timestamptz
);
create index on donations(user_id);
alter table donations enable row level security;
create policy "donations read own/admin" on donations for select using (user_id = auth.uid() or is_admin());
-- no client insert/update: only the create-donation function and the webhook (service role) write here

create or replace function admin_stats() returns json language sql stable security definer set search_path=public as $$
 select case when is_admin() then json_build_object(
  'products',(select count(*) from products),'users',(select count(*) from profiles),
  'purchases',(select count(*) from purchases where status='paid'),
  'downloads',(select count(*) from download_logs),
  'revenue_cents',(select coalesce(sum(amount_cents),0) from purchases where status='paid'),
  'storage_bytes',(select coalesce(sum(size_bytes),0) from product_files),
  'donations_cents',(select coalesce(sum(amount_cents),0) from donations where status='paid'),
  'donations_count',(select count(*) from donations where status='paid')) end $$;
