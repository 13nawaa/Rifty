create table if not exists public.rifty_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.rifty_user_data enable row level security;

drop policy if exists "Users can read their Rifty data" on public.rifty_user_data;
create policy "Users can read their Rifty data"
on public.rifty_user_data for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their Rifty data" on public.rifty_user_data;
create policy "Users can create their Rifty data"
on public.rifty_user_data for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their Rifty data" on public.rifty_user_data;
create policy "Users can update their Rifty data"
on public.rifty_user_data for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.rifty_challenge_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_slug text not null,
  display_name text not null check (char_length(display_name) between 1 and 40),
  caption text check (caption is null or char_length(caption) <= 180),
  video_path text not null unique,
  xp_awarded integer not null default 50 check (xp_awarded = 50),
  created_at timestamptz not null default now(),
  unique (challenge_slug, user_id)
);

alter table public.rifty_challenge_posts enable row level security;

drop policy if exists "Challenge posts are public" on public.rifty_challenge_posts;
create policy "Challenge posts are public"
on public.rifty_challenge_posts for select
using (true);

drop policy if exists "Users can publish their challenge post" on public.rifty_challenge_posts;
create policy "Users can publish their challenge post"
on public.rifty_challenge_posts for insert
with check (auth.uid() = user_id and xp_awarded = 50);

drop policy if exists "Users can delete their challenge post" on public.rifty_challenge_posts;
create policy "Users can delete their challenge post"
on public.rifty_challenge_posts for delete
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rifty-challenges', 'rifty-challenges', true, 26214400, array['video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Challenge videos are public" on storage.objects;
create policy "Challenge videos are public"
on storage.objects for select
using (bucket_id = 'rifty-challenges');

drop policy if exists "Users can upload their challenge video" on storage.objects;
create policy "Users can upload their challenge video"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'rifty-challenges'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their challenge video" on storage.objects;
create policy "Users can delete their challenge video"
on storage.objects for delete to authenticated
using (
  bucket_id = 'rifty-challenges'
  and (storage.foldername(name))[1] = auth.uid()::text
);
