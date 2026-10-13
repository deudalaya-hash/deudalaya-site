-- Add public creator profiles and shared social actions for feed_posts.
-- Run once in Supabase SQL Editor after the existing feed_posts table is ready.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(username) and username ~ '^[a-z0-9._]{3,24}$'),
  display_name text not null default 'देउडालय सदस्य' check (length(display_name) between 1 and 60),
  bio text not null default '' check (length(bio) <= 300),
  avatar_path text,
  created_at timestamptz not null default now()
);

create or replace function public.create_deudalaya_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
  requested_name text;
begin
  requested_username := lower(coalesce(new.raw_user_meta_data ->> 'username', ''));
  requested_name := left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(new.email, 'देउडालय सदस्य'), '@', 1)), 60);
  if requested_username !~ '^[a-z0-9._]{3,24}$' then
    requested_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 16);
  end if;
  begin
    insert into public.profiles (id, username, display_name)
    values (new.id, requested_username, requested_name)
    on conflict (id) do nothing;
  exception when unique_violation then
    insert into public.profiles (id, username, display_name)
    values (new.id, 'user_' || substr(replace(new.id::text, '-', ''), 1, 16), requested_name)
    on conflict (id) do nothing;
  end;
  return new;
end;
$$;

drop trigger if exists deudalaya_profile_after_signup on auth.users;
create trigger deudalaya_profile_after_signup
  after insert on auth.users
  for each row execute function public.create_deudalaya_profile();

-- Give accounts created before profile setup a public profile as well.
insert into public.profiles (id, username, display_name)
select
  users.id,
  'user_' || substr(replace(users.id::text, '-', ''), 1, 16),
  left(coalesce(nullif(btrim(users.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(users.email, 'देउडालय सदस्य'), '@', 1)), 60)
from auth.users as users
on conflict (id) do nothing;

create table if not exists public.post_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.post_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create table if not exists public.post_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists post_comments_post_created_idx on public.post_comments (post_id, created_at desc);
create index if not exists post_likes_post_idx on public.post_likes (post_id);
create index if not exists post_follows_followed_idx on public.post_follows (followed_id);
create index if not exists feed_posts_user_created_idx on public.feed_posts (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_follows enable row level security;
alter table public.post_bookmarks enable row level security;

grant select on public.profiles to anon, authenticated;
grant update (username, display_name, bio, avatar_path) on public.profiles to authenticated;
grant select on public.post_likes, public.post_comments, public.post_follows to anon, authenticated;
grant insert, delete on public.post_likes to authenticated;
grant insert, delete on public.post_comments to authenticated;
grant insert, delete on public.post_follows to authenticated;
grant select, insert, delete on public.post_bookmarks to authenticated;

drop policy if exists profiles_public_read on public.profiles;
create policy profiles_public_read on public.profiles for select using (true);
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists post_likes_public_read on public.post_likes;
create policy post_likes_public_read on public.post_likes for select using (true);
drop policy if exists post_likes_self_insert on public.post_likes;
create policy post_likes_self_insert on public.post_likes for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists post_likes_self_delete on public.post_likes;
create policy post_likes_self_delete on public.post_likes for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists post_comments_public_read on public.post_comments;
create policy post_comments_public_read on public.post_comments for select using (true);
drop policy if exists post_comments_self_insert on public.post_comments;
create policy post_comments_self_insert on public.post_comments for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists post_comments_self_delete on public.post_comments;
create policy post_comments_self_delete on public.post_comments for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists post_follows_public_read on public.post_follows;
create policy post_follows_public_read on public.post_follows for select using (true);
drop policy if exists post_follows_self_insert on public.post_follows;
create policy post_follows_self_insert on public.post_follows for insert to authenticated with check (follower_id = (select auth.uid()));
drop policy if exists post_follows_self_delete on public.post_follows;
create policy post_follows_self_delete on public.post_follows for delete to authenticated using (follower_id = (select auth.uid()));

drop policy if exists post_bookmarks_private_read on public.post_bookmarks;
create policy post_bookmarks_private_read on public.post_bookmarks for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists post_bookmarks_self_insert on public.post_bookmarks;
create policy post_bookmarks_self_insert on public.post_bookmarks for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists post_bookmarks_self_delete on public.post_bookmarks;
create policy post_bookmarks_self_delete on public.post_bookmarks for delete to authenticated using (user_id = (select auth.uid()));
