-- Allow admin-only uploads to the public feed's existing videos bucket.
-- This migration does not change the application's 50 MiB limit.
create or replace function public.is_deudalaya_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- Supabase's global Storage limit must also be at least 50 MiB.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['video/mp4', 'video/webm', 'image/jpeg', 'image/png', 'image/webp']
where id = 'videos';

do $$
begin
  if not exists (select 1 from storage.buckets where id = 'videos') then
    raise exception 'The existing videos Storage bucket is missing; create/configure it before applying admin upload policies.';
  end if;
end
$$;

-- Remove the earlier foundation-schema duration cap without trimming media.
do $$
begin
  if to_regclass('public.videos') is not null then
    alter table public.videos alter column duration_seconds type numeric using duration_seconds::numeric;
    alter table public.videos drop constraint if exists videos_duration_seconds_check;
    alter table public.videos
      add constraint videos_duration_seconds_check check (duration_seconds > 0);
  end if;
end
$$;

-- A restrictive gate combines with any existing permissive policies, so a
-- pre-existing authenticated-user upload policy cannot authorize non-admins.
drop policy if exists deudalaya_videos_admin_upload_gate on storage.objects;
create policy deudalaya_videos_admin_upload_gate
  on storage.objects as restrictive
  for insert to public
  with check (bucket_id <> 'videos' or (select public.is_deudalaya_admin()));

drop policy if exists deudalaya_videos_admin_upload on storage.objects;
create policy deudalaya_videos_admin_upload
  on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_deudalaya_admin())
  );

-- feed_posts is part of the existing live-page integration but was not created
-- by the repository's earlier foundation migrations. Guard it for portability.
do $$
begin
  if to_regclass('public.feed_posts') is not null then
    execute 'alter table public.feed_posts enable row level security';
    execute 'grant select on public.feed_posts to anon, authenticated';
    execute 'grant insert on public.feed_posts to authenticated';
    execute 'drop policy if exists deudalaya_feed_posts_public_read on public.feed_posts';
    execute 'create policy deudalaya_feed_posts_public_read on public.feed_posts for select to anon, authenticated using (true)';
    execute 'drop policy if exists deudalaya_feed_posts_admin_insert_gate on public.feed_posts';
    execute 'create policy deudalaya_feed_posts_admin_insert_gate on public.feed_posts as restrictive for insert to public with check ((select public.is_deudalaya_admin()))';
    execute 'drop policy if exists deudalaya_feed_posts_admin_insert on public.feed_posts';
    execute 'create policy deudalaya_feed_posts_admin_insert on public.feed_posts for insert to authenticated with check (user_id = (select auth.uid()) and (select public.is_deudalaya_admin()))';
  else
    raise exception 'The existing public.feed_posts table is missing; apply this migration only after the feed table exists.';
  end if;
end
$$;
