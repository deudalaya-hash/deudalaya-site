-- Enforce the 25 MB cap for future uploads to the existing feed bucket.
-- Existing objects and database rows are left untouched.
update storage.buckets
set file_size_limit = 25000000
where id = 'videos';

do $$
begin
  if not exists (select 1 from storage.buckets where id = 'videos') then
    raise exception 'The existing videos Storage bucket is missing; configure it before applying the 25 MB upload limit.';
  end if;
end
$$;
