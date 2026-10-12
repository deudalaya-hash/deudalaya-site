-- देउडालय platform foundation. Apply only after creating a Supabase project.
-- Admin checks use auth.jwt()->app_metadata.role, which end users cannot edit.
create extension if not exists pgcrypto;

create or replace function public.is_deudalaya_admin()
returns boolean language sql stable security invoker
set search_path = '' as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(username) and length(username) between 3 and 30),
  display_name text not null default '',
  avatar_path text,
  bio text not null default '' check (length(bio) <= 300),
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete restrict,
  caption text not null default '' check (length(caption) <= 220),
  description text not null default '' check (length(description) <= 2000),
  category text not null check (category in ('देउडा','लोकगीत तथा संगीत','कला तथा संस्कृति','चाडपर्व तथा जात्रा','गाउँघर तथा जनजीवन','पर्यटन तथा प्राकृतिक सौन्दर्य','भाषा तथा साहित्य','इतिहास तथा परम्परा','स्थानीय उत्पादन तथा सीप','युवा प्रतिभा','शिक्षा तथा अनुसन्धान','अन्य')),
  location text check (length(location) <= 120),
  storage_path text not null unique,
  thumbnail_path text,
  duration_seconds numeric(5,2) not null check (duration_seconds > 0 and duration_seconds <= 15),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  status text not null default 'pending' check (status in ('pending','approved','rejected','removed')),
  moderation_note text,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.video_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  body text not null check (length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, creator_id),
  check (follower_id <> creator_id)
);
create table if not exists public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null check (length(reason) between 3 and 500),
  created_at timestamptz not null default now(),
  check (video_id is not null or comment_id is not null)
);

create index if not exists videos_public_feed_idx on public.videos (published_at desc) where status = 'approved';
create index if not exists videos_pending_idx on public.videos (created_at) where status = 'pending';
create index if not exists videos_category_idx on public.videos (category, published_at desc) where status = 'approved';
create index if not exists comments_video_idx on public.comments (video_id, created_at);

alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.video_likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.bookmarks enable row level security;
alter table public.reports enable row level security;

drop policy if exists profiles_public_read on public.profiles;
create policy profiles_public_read on public.profiles for select using (true);
drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists videos_public_read on public.videos;
create policy videos_public_read on public.videos for select using (status = 'approved' or creator_id = (select auth.uid()) or (select public.is_deudalaya_admin()));
drop policy if exists videos_owner_submit on public.videos;
create policy videos_owner_submit on public.videos for insert to authenticated with check (creator_id = (select auth.uid()) and status = 'pending' and published_at is null);
drop policy if exists videos_admin_moderate on public.videos;
create policy videos_admin_moderate on public.videos for update to authenticated using ((select public.is_deudalaya_admin())) with check ((select public.is_deudalaya_admin()));
drop policy if exists videos_owner_delete_pending on public.videos;
create policy videos_owner_delete_pending on public.videos for delete to authenticated using (creator_id = (select auth.uid()) and status in ('pending','rejected'));

drop policy if exists likes_read_public on public.video_likes;
create policy likes_read_public on public.video_likes for select using (exists(select 1 from public.videos v where v.id = video_id and v.status = 'approved') or user_id = (select auth.uid()) or (select public.is_deudalaya_admin()));
drop policy if exists likes_insert_self on public.video_likes;
create policy likes_insert_self on public.video_likes for insert to authenticated with check (user_id = (select auth.uid()) and exists(select 1 from public.videos v where v.id = video_id and v.status = 'approved'));
drop policy if exists likes_delete_self on public.video_likes;
create policy likes_delete_self on public.video_likes for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists comments_read_public on public.comments;
create policy comments_read_public on public.comments for select using (exists(select 1 from public.videos v where v.id = video_id and v.status = 'approved') or user_id = (select auth.uid()) or (select public.is_deudalaya_admin()));
drop policy if exists comments_insert_self on public.comments;
create policy comments_insert_self on public.comments for insert to authenticated with check (user_id = (select auth.uid()) and exists(select 1 from public.videos v where v.id = video_id and v.status = 'approved'));
drop policy if exists comments_delete_owner_admin on public.comments;
create policy comments_delete_owner_admin on public.comments for delete to authenticated using (user_id = (select auth.uid()) or (select public.is_deudalaya_admin()));

drop policy if exists follows_read on public.follows;
create policy follows_read on public.follows for select using (true);
drop policy if exists follows_self_insert on public.follows;
create policy follows_self_insert on public.follows for insert to authenticated with check (follower_id = (select auth.uid()));
drop policy if exists follows_self_delete on public.follows;
create policy follows_self_delete on public.follows for delete to authenticated using (follower_id = (select auth.uid()));

drop policy if exists bookmarks_private_read on public.bookmarks;
create policy bookmarks_private_read on public.bookmarks for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists bookmarks_self_insert on public.bookmarks;
create policy bookmarks_self_insert on public.bookmarks for insert to authenticated with check (user_id = (select auth.uid()) and exists(select 1 from public.videos v where v.id = video_id and v.status = 'approved'));
drop policy if exists bookmarks_self_delete on public.bookmarks;
create policy bookmarks_self_delete on public.bookmarks for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists reports_submit_self on public.reports;
create policy reports_submit_self on public.reports for insert to authenticated with check (reporter_id = (select auth.uid()));
drop policy if exists reports_admin_read on public.reports;
create policy reports_admin_read on public.reports for select to authenticated using ((select public.is_deudalaya_admin()));

-- Private bucket; the backend must still inspect the actual media before approval.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-videos', 'community-videos', false, 26214400, array['video/mp4','video/webm'])
on conflict (id) do update set public = false, file_size_limit = 26214400, allowed_mime_types = array['video/mp4','video/webm'];

drop policy if exists video_upload_own_folder on storage.objects;
create policy video_upload_own_folder on storage.objects for insert to authenticated with check (bucket_id = 'community-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists video_read_owner_admin_approved on storage.objects;
create policy video_read_owner_admin_approved on storage.objects for select to authenticated using (
  bucket_id = 'community-videos' and (
    (storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_deudalaya_admin()) or
    exists(select 1 from public.videos v where v.storage_path = name and v.status = 'approved')
  )
);
drop policy if exists video_delete_owner on storage.objects;
create policy video_delete_owner on storage.objects for delete to authenticated using (bucket_id = 'community-videos' and (storage.foldername(name))[1] = (select auth.uid())::text and not exists(select 1 from public.videos v where v.storage_path = name and v.status = 'approved'));
