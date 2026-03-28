-- MASTER RESET SCRIPT FOR .AHEAD
-- WARNING: This resets profiles and activities in the current Supabase project.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TRIGGER IF EXISTS on_activity_changed ON public.activities;
DROP TRIGGER IF EXISTS on_activity_logged ON public.activities;
DROP FUNCTION IF EXISTS public.sync_profile_score();
DROP FUNCTION IF EXISTS public.update_profile_score();

DROP TABLE IF EXISTS public.activities;
DROP TABLE IF EXISTS public.profiles;

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

CREATE TABLE public.activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  type text CHECK (type IN ('learning', 'practice', 'project')),
  score integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own activities" ON public.activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON public.activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON public.activities
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.sync_profile_score()
RETURNS trigger AS $$
DECLARE
  target_user_id uuid;
BEGIN
  target_user_id := coalesce(new.user_id, old.user_id);

  UPDATE public.profiles
  SET total_score = coalesce(
    (SELECT sum(score) FROM public.activities WHERE user_id = target_user_id),
    0
  ),
      updated_at = timezone('utc'::text, now())
  WHERE id = target_user_id;

  RETURN coalesce(new, old);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_activity_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.activities
  FOR EACH ROW EXECUTE PROCEDURE public.sync_profile_score();

-- Manual profile bootstrap for an existing user if needed:
-- INSERT INTO public.profiles (id, username, onboarded)
-- VALUES ('YOUR_USER_ID', 'your_username', true)
-- ON CONFLICT (id) DO NOTHING;
