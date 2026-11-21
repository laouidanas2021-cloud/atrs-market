-- Run AFTER schema.sql. Adds customer email for the Orders tab + starter categories.
alter table profiles add column if not exists email text;
update profiles p set email = u.email from auth.users u where u.id = p.id;
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path=public as
$$ begin insert into profiles(id, full_name, email) values (new.id, new.raw_user_meta_data->>'full_name', new.email); return new; end $$;
alter table purchases add constraint purchases_profile_fk foreign key (user_id) references profiles(id);
insert into categories(name, slug) values ('Software','software'),('Apps','apps'),('Utilities','utilities'),('Games','games'),('Templates','templates'),('Documents','documents') on conflict do nothing;
