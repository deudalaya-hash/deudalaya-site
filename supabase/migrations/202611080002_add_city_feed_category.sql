-- Add शहर to allowed feed placements without changing any current assignments.
alter table public.feed_posts
  drop constraint if exists feed_posts_feed_category_check;

alter table public.feed_posts
  add constraint feed_posts_feed_category_check
  check (feed_category is null or feed_category in ('देउडा', 'गाउँघर', 'शहर', 'सुदूर कर्णाली'));
