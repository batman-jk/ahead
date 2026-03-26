-- Profiles table to store user rankings and total points
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  full_name text,
  avatar_url text,
  total_points integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Activities table to store learning logs
create table if not exists public.activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  description text not null,
  type text not null,
  points integer not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS (Row Level Security) - Basic Setup
alter table public.profiles enable row level security;
alter table public.activities enable row level security;

-- Policies for Profiles
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Policies for Activities
drop policy if exists "Users can view own activities" on activities;
create policy "Users can view own activities" on activities for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own activities" on activities;
create policy "Users can insert own activities" on activities for insert with check (auth.uid() = user_id);

-- Trigger to update total_points in profiles when an activity is added
create or replace function public.update_profile_points()
returns trigger as $$
begin
  update public.profiles
  set total_points = total_points + new.points
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_activity_logged on public.activities;
create trigger on_activity_logged
  after insert on public.activities
  for each row execute procedure public.update_profile_points();

-- Trigger for automatic profile creation on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
