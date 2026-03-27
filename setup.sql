-- MASTER RESET SCRIPT FOR .AHEAD
-- This will DROP existing tables and recreate them to ensure a 100% clean state.
-- WARNING: This deletes your current user scores and activities.

-- 1. Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TRIGGER IF EXISTS on_activity_logged ON public.activities;
DROP FUNCTION IF EXISTS public.update_profile_score();

-- 2. Drop existing tables
DROP TABLE IF EXISTS public.activities;
DROP TABLE IF EXISTS public.profiles;

-- 3. Create PROFILES table with all new columns
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  college text,
  state text,
  goal text,
  skills jsonb DEFAULT '[]'::jsonb,
  onboarded boolean DEFAULT false,
  total_score integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
-- ... (rest of the file)

-- 10. MANUAL FIX FOR EXISTING USERS (Run this if you have no profile):
-- Replace 'YOUR_USER_ID' with the ID from the Auth -> Users tab in Supabase
-- INSERT INTO public.profiles (id, username, onboarded) 
-- VALUES ('YOUR_USER_ID', 'your_username', true)
-- ON CONFLICT (id) DO NOTHING;

-- 4. Create ACTIVITIES table with new column names
CREATE TABLE public.activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  type text CHECK (type IN ('learning', 'practice', 'project')),
  score integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies (Allow users to read/write their own data)
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own activities" ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Trigger: Automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Trigger: Automatically update profile total_score when activity is logged
CREATE OR REPLACE FUNCTION public.update_profile_score()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET total_score = total_score + new.score
  WHERE id = new.user_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_activity_logged
  AFTER INSERT ON public.activities
  FOR EACH ROW EXECUTE PROCEDURE public.update_profile_score();

-- 9. Add a sample user if needed (Manual)
-- INSERT INTO public.profiles (id, username, onboarded) VALUES ('your-uuid-here', 'testuser', true);
