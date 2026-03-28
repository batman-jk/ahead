-- PATCH SCRIPT FOR GAMIFIED LEVELS (XP & AHEAD SCORE SEPARATION)

-- 1. Add total_xp to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_xp integer DEFAULT 0;

-- 2. Update the sync_profile_score function to separate Score and XP.
-- Activity Score = sum of points for leaderboard
-- Total XP = 5 XP per activity + all xp from challenges
CREATE OR REPLACE FUNCTION public.sync_profile_score()
RETURNS trigger AS $$
DECLARE
  target_user_id uuid;
BEGIN
  target_user_id := coalesce(new.user_id, old.user_id);

  UPDATE public.profiles
  SET 
    -- 1. Total Score is strictly the sum of the raw scores for the leaderboard
    total_score = coalesce((
      SELECT sum(score) FROM public.activities WHERE user_id = target_user_id
    ), 0),
    
    -- 2. Total XP is 5 XP for every logged activity PLUS the sum of xp_earned from completed challenges
    total_xp = coalesce((
      SELECT count(*) * 5 FROM public.activities WHERE user_id = target_user_id
    ), 0) + coalesce((
      SELECT sum(xp_earned) FROM public.xp_log WHERE user_id = target_user_id
    ), 0),

    updated_at = timezone('utc'::text, now())
  WHERE id = target_user_id;

  RETURN coalesce(new, old);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. In case any existing score data got scrambled, let's run an initial wipe & recalculation natively.
-- Because triggers run per row, a manual sync ensures everyone is up to date immediately!
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id FROM public.profiles LOOP
    UPDATE public.profiles
    SET 
      total_score = coalesce((SELECT sum(score) FROM public.activities WHERE user_id = rec.id), 0),
      total_xp = coalesce((SELECT count(*) * 5 FROM public.activities WHERE user_id = rec.id), 0) + 
                 coalesce((SELECT sum(xp_earned) FROM public.xp_log WHERE user_id = rec.id), 0)
    WHERE id = rec.id;
  END LOOP;
END;
$$;
