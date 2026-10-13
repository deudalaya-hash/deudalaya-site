-- Raise video uploads from 25 MiB to 50 MiB.
-- Run in the Supabase SQL editor or through the project's migration workflow.
update storage.buckets
set file_size_limit = 52428800
where id in ('videos', 'community-videos');

do $$
begin
  if to_regclass('public.videos') is not null and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'videos' and column_name = 'size_bytes'
  ) then
    alter table public.videos drop constraint if exists videos_size_bytes_check;
    alter table public.videos
      add constraint videos_size_bytes_check check (size_bytes > 0 and size_bytes <= 52428800);
  end if;
end
$$;