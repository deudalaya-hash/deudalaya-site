-- Store feed placement separately from the existing upload-topic category.
-- Existing rows default to Deuda to preserve their current feed visibility.
do $$
begin
  if to_regclass('public.feed_posts') is null then
    raise exception 'The existing public.feed_posts table is missing; apply this migration after the feed table exists.';
  end if;
end
$$;

alter table public.feed_posts
  add column if not exists feed_category text;

-- Existing feed posts remain in the original default category. New rows may
-- derive feed placement from an explicit active category selected at upload.
update public.feed_posts set feed_category = 'देउडा' where feed_category is null;

alter table public.feed_posts
  drop constraint if exists feed_posts_feed_category_check;
alter table public.feed_posts
  add constraint feed_posts_feed_category_check
  check (feed_category is null or feed_category in ('देउडा', 'गाउँघर', 'सुदूर कर्णाली'));

create index if not exists feed_posts_feed_category_created_idx
  on public.feed_posts (feed_category, created_at desc);

-- Category reassignment is admin-only even if older permissive update policies exist.
drop policy if exists deudalaya_feed_posts_admin_category_update_gate on public.feed_posts;
create policy deudalaya_feed_posts_admin_category_update_gate
  on public.feed_posts as restrictive
  for update to public
  using ((select public.is_deudalaya_admin()))
  with check ((select public.is_deudalaya_admin()));

drop policy if exists deudalaya_feed_posts_admin_category_update on public.feed_posts;
create policy deudalaya_feed_posts_admin_category_update
  on public.feed_posts for update to authenticated
  using ((select public.is_deudalaya_admin()))
  with check ((select public.is_deudalaya_admin()));

grant update (feed_category) on public.feed_posts to authenticated;
