-- PATCH SCRIPT FOR DAILY & WEEKLY CHALLENGES

-- 1. Create challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type text CHECK (type IN ('daily', 'weekly')),
  title text NOT NULL,
  description text NOT NULL,
  xp_reward integer NOT NULL,
  deadline timestamp with time zone NOT NULL,
  is_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create user_streaks table
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_completed_date timestamp with time zone
);

-- 3. Create xp_log table
CREATE TABLE IF NOT EXISTS public.xp_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES public.challenges ON DELETE SET NULL,
  xp_earned integer NOT NULL,
  earned_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_log ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for challenges
CREATE POLICY "Users can view their own challenges" ON public.challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenges" ON public.challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges" ON public.challenges
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own challenges" ON public.challenges
  FOR DELETE USING (auth.uid() = user_id);

-- 6. RLS Policies for user_streaks
CREATE POLICY "Users can view their own streaks" ON public.user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks" ON public.user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" ON public.user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. RLS Policies for xp_log
CREATE POLICY "Users can view their own xp logs" ON public.xp_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own xp logs" ON public.xp_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own xp logs" ON public.xp_log
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Replace sync_profile_score to include xp_log
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
  ) + coalesce(
    (SELECT sum(xp_earned) FROM public.xp_log WHERE user_id = target_user_id),
    0
  ),
      updated_at = timezone('utc'::text, now())
  WHERE id = target_user_id;

  RETURN coalesce(new, old);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Add trigger on xp_log to sync score
DROP TRIGGER IF EXISTS on_xp_log_changed ON public.xp_log;
CREATE TRIGGER on_xp_log_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.xp_log
  FOR EACH ROW EXECUTE PROCEDURE public.sync_profile_score();
