-- FTJ Supabase schema
-- Run this entire script in Supabase Dashboard > SQL Editor.
create table if not exists public.user_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  store text not null,
  record_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, store, record_id)
);

alter table public.user_records enable row level security;

drop policy if exists "Users can read their own FTJ records" on public.user_records;
create policy "Users can read their own FTJ records"
on public.user_records for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own FTJ records" on public.user_records;
create policy "Users can insert their own FTJ records"
on public.user_records for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own FTJ records" on public.user_records;
create policy "Users can update their own FTJ records"
on public.user_records for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own FTJ records" on public.user_records;
create policy "Users can delete their own FTJ records"
on public.user_records for delete to authenticated
using (auth.uid() = user_id);

-- Private bucket for journal/trade screenshots.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trade-screenshots', 'trade-screenshots', false, 8388608,
        array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = 8388608,
  allowed_mime_types = array['image/png','image/jpeg','image/webp'];

-- Private bucket for other user images (e.g. future avatars).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-images', 'user-images', false, 8388608,
        array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = 8388608,
  allowed_mime_types = array['image/png','image/jpeg','image/webp'];

drop policy if exists "Users read own trade screenshots" on storage.objects;
create policy "Users read own trade screenshots"
on storage.objects for select to authenticated
using (bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users upload own trade screenshots" on storage.objects;
create policy "Users upload own trade screenshots"
on storage.objects for insert to authenticated
with check (bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update own trade screenshots" on storage.objects;
create policy "Users update own trade screenshots"
on storage.objects for update to authenticated
using (bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete own trade screenshots" on storage.objects;
create policy "Users delete own trade screenshots"
on storage.objects for delete to authenticated
using (bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users read own user images" on storage.objects;
create policy "Users read own user images"
on storage.objects for select to authenticated
using (bucket_id = 'user-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users upload own user images" on storage.objects;
create policy "Users upload own user images"
on storage.objects for insert to authenticated
with check (bucket_id = 'user-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update own user images" on storage.objects;
create policy "Users update own user images"
on storage.objects for update to authenticated
using (bucket_id = 'user-images' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'user-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete own user images" on storage.objects;
create policy "Users delete own user images"
on storage.objects for delete to authenticated
using (bucket_id = 'user-images' and (storage.foldername(name))[1] = auth.uid()::text);
