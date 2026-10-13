-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run
create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index post_comments_post_id_created_at_idx
  on public.post_comments (post_id, created_at desc);

alter table public.post_comments enable row level security;

create policy "Anyone can view comments"
  on public.post_comments for select
  to anon, authenticated
  using (true);

create policy "Signed-in users can add their own comments"
  on public.post_comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.post_comments for delete
  to authenticated
  using (auth.uid() = user_id);

grant select on public.post_comments to anon, authenticated;
grant insert, delete on public.post_comments to authenticated;
