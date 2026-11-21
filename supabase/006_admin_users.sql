-- Run after 001-005. Lets admins see every registered user and their last login.
create or replace function admin_list_users() returns table(
  id uuid, email text, full_name text, created_at timestamptz, last_sign_in_at timestamptz,
  purchase_count bigint, is_admin boolean
) language sql stable security definer set search_path = public as $$
  select p.id, u.email, p.full_name, p.created_at, u.last_sign_in_at,
    (select count(*) from purchases where user_id = p.id and status = 'paid'),
    exists(select 1 from admin_roles a where a.user_id = p.id)
  from profiles p join auth.users u on u.id = p.id
  where is_admin()
  order by p.created_at desc
$$;
revoke execute on function admin_list_users() from public, anon;
grant execute on function admin_list_users() to authenticated;
