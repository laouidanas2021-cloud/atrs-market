-- Run AFTER 002. Reviews display names + stops users editing protected profile columns.
alter table reviews add column if not exists author_name text;
create or replace function set_review_author() returns trigger language plpgsql security definer set search_path=public as
$$ begin select coalesce(nullif(full_name,''),'Customer') into new.author_name from profiles where id=new.user_id; return new; end $$;
drop trigger if exists review_author on reviews;
create trigger review_author before insert on reviews for each row execute function set_review_author();
-- users may only change their own name/avatar, never email
revoke update on profiles from authenticated, anon;
grant update (full_name, avatar_url) on profiles to authenticated;
