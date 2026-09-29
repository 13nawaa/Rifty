create table if not exists public.rifty_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.rifty_user_data enable row level security;

drop policy if exists "Users can read their Rifty data" on public.rifty_user_data;
create policy "Users can read their Rifty data"
on public.rifty_user_data for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their Rifty data" on public.rifty_user_data;
create policy "Users can create their Rifty data"
on public.rifty_user_data for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their Rifty data" on public.rifty_user_data;
create policy "Users can update their Rifty data"
on public.rifty_user_data for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

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
on public.rifty_challenge_posts for select to anon, authenticated
using (true);

drop policy if exists "Users can publish their challenge post" on public.rifty_challenge_posts;
create policy "Users can publish their challenge post"
on public.rifty_challenge_posts for insert to authenticated
with check ((select auth.uid()) = user_id and xp_awarded = 50
  and split_part(video_path, '/', 1) = (select auth.uid())::text
  and exists (select 1 from storage.objects where bucket_id = 'rifty-challenges' and name = video_path));

drop policy if exists "Users can delete their challenge post" on public.rifty_challenge_posts;
create policy "Users can delete their challenge post"
on public.rifty_challenge_posts for delete to authenticated
using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rifty-challenges', 'rifty-challenges', true, 26214400, array['video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Challenge videos are public" on storage.objects;
create policy "Challenge videos are public"
on storage.objects for select to anon, authenticated
using (bucket_id = 'rifty-challenges');

drop policy if exists "Users can upload their challenge video" on storage.objects;
create policy "Users can upload their challenge video"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'rifty-challenges'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can delete their challenge video" on storage.objects;
create policy "Users can delete their challenge video"
on storage.objects for delete to authenticated
using (
  bucket_id = 'rifty-challenges'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Explicit Data API grants; RLS restricts private rows to their owner.
revoke all on public.rifty_user_data from anon, authenticated;
grant select, insert, update on public.rifty_user_data to authenticated;
revoke all on public.rifty_challenge_posts from anon, authenticated;
grant select on public.rifty_challenge_posts to anon, authenticated;
grant insert, delete on public.rifty_challenge_posts to authenticated;
create index if not exists rifty_challenge_posts_user_idx on public.rifty_challenge_posts(user_id);
create index if not exists rifty_challenge_posts_feed_idx on public.rifty_challenge_posts(challenge_slug, created_at desc);

create table public.rifty_handles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 nickname text not null check (nickname ~ '^[A-Za-z0-9_]{3,24}$'),
 created_at timestamptz not null default now()
);
create unique index rifty_handles_nickname_unique on public.rifty_handles (lower(nickname));
alter table public.rifty_handles enable row level security;
revoke all on public.rifty_handles from anon, authenticated;
grant select, insert, update on public.rifty_handles to authenticated;
create policy "Read own handle" on public.rifty_handles for select to authenticated using ((select auth.uid())=user_id);
create policy "Claim own handle" on public.rifty_handles for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Update own handle" on public.rifty_handles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create or replace function public.rifty_set_post_author()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare registered_name text;
begin
 select nickname into registered_name from public.rifty_handles where user_id = (select auth.uid());
 if registered_name is null then raise exception 'Choisissez votre pseudo avant de publier.'; end if;
 new.display_name := registered_name;
 return new;
end $$;
revoke all on function public.rifty_set_post_author() from public, anon, authenticated;
grant execute on function public.rifty_set_post_author() to authenticated;
create trigger rifty_post_author before insert on public.rifty_challenge_posts
for each row execute function public.rifty_set_post_author();
