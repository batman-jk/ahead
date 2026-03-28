-- Non-destructive patch for leaderboard reads and log deletion.
-- Run this in Supabase SQL Editor if your current database already exists.

DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;
CREATE POLICY "Users can delete their own activities" ON public.activities
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS on_activity_changed ON public.activities;
DROP TRIGGER IF EXISTS on_activity_logged ON public.activities;
DROP FUNCTION IF EXISTS public.sync_profile_score();
DROP FUNCTION IF EXISTS public.update_profile_score();

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
