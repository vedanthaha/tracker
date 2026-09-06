-- 20260907000000_community_features.sql

-- 1. Add visibility columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS community_visible boolean not null default false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS leaderboard_visible boolean not null default false;

-- 2. Add Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_profiles_community_visible ON public.profiles(community_visible);
CREATE INDEX IF NOT EXISTS idx_profiles_leaderboard_visible ON public.profiles(leaderboard_visible);

-- (Explicitly NOT creating a public SELECT policy on profiles to prevent exposing private fields)

-- 3. Create a helper function to calculate streaks for a user
CREATE OR REPLACE FUNCTION public.calculate_user_streaks(target_user_id uuid, viewer_tz text)
RETURNS TABLE (current_streak integer, longest_streak integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_streak integer := 0;
  v_longest_streak integer := 0;
BEGIN
  WITH active_dates AS (
    SELECT DISTINCT (created_at AT TIME ZONE viewer_tz)::date AS d
    FROM public.tasks
    WHERE user_id = target_user_id AND (created_at AT TIME ZONE viewer_tz)::date <= (CURRENT_TIMESTAMP AT TIME ZONE viewer_tz)::date
    UNION
    SELECT DISTINCT (completed_at AT TIME ZONE viewer_tz)::date AS d
    FROM public.tasks
    WHERE user_id = target_user_id AND completed = true AND (completed_at AT TIME ZONE viewer_tz)::date <= (CURRENT_TIMESTAMP AT TIME ZONE viewer_tz)::date
  ),
  streak_groups AS (
    SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d))::integer AS grp
    FROM active_dates
  ),
  streaks AS (
    SELECT grp, COUNT(*)::integer AS len, MAX(d) AS end_date
    FROM streak_groups
    GROUP BY grp
  )
  SELECT 
    COALESCE(MAX(len) FILTER (WHERE end_date >= (CURRENT_TIMESTAMP AT TIME ZONE viewer_tz)::date - 1), 0),
    COALESCE(MAX(len), 0)
  INTO v_current_streak, v_longest_streak
  FROM streaks;

  RETURN QUERY SELECT v_current_streak, v_longest_streak;
END;
$$;

-- 4. Create the main RPC for the leaderboard
CREATE OR REPLACE FUNCTION public.get_community_leaderboard(
  viewer_tz text,
  period_filter text DEFAULT 'week', -- 'week', 'month', 'all'
  sort_metric text DEFAULT 'streak', -- 'streak', 'tasks', 'notes'
  limit_count integer DEFAULT 20,
  page_offset integer DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  current_streak integer,
  longest_streak integer,
  tasks_completed integer,
  notes_created integer,
  focus_minutes integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH eligible_users AS (
    SELECT id, name, profiles.avatar_url
    FROM public.profiles
    WHERE community_visible = true AND leaderboard_visible = true
  ),
  user_stats AS (
    SELECT 
      u.id,
      (SELECT s.current_streak FROM public.calculate_user_streaks(u.id, viewer_tz) s) AS cur_streak,
      (SELECT s.longest_streak FROM public.calculate_user_streaks(u.id, viewer_tz) s) AS lng_streak,
      (
        SELECT COUNT(*)::integer FROM public.tasks t 
        WHERE t.user_id = u.id AND t.completed = true 
        AND (
          period_filter = 'all' OR 
          (period_filter = 'week' AND t.completed_at >= date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE viewer_tz) AT TIME ZONE viewer_tz) OR
          (period_filter = 'month' AND t.completed_at >= date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE viewer_tz) AT TIME ZONE viewer_tz)
        )
      ) AS t_completed,
      (
        SELECT COUNT(*)::integer FROM public.notes n 
        WHERE n.user_id = u.id 
        AND (
          period_filter = 'all' OR 
          (period_filter = 'week' AND n.created_at >= date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE viewer_tz) AT TIME ZONE viewer_tz) OR
          (period_filter = 'month' AND n.created_at >= date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE viewer_tz) AT TIME ZONE viewer_tz)
        )
      ) AS n_created,
      (
        SELECT COALESCE(SUM(duration_seconds) / 60, 0)::integer FROM public.focus_sessions f 
        WHERE f.user_id = u.id
        AND (
          period_filter = 'all' OR 
          (period_filter = 'week' AND f.started_at >= date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE viewer_tz) AT TIME ZONE viewer_tz) OR
          (period_filter = 'month' AND f.started_at >= date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE viewer_tz) AT TIME ZONE viewer_tz)
        )
      ) AS f_minutes
    FROM eligible_users u
  )
  SELECT 
    eu.id,
    eu.name,
    eu.avatar_url,
    us.cur_streak,
    us.lng_streak,
    us.t_completed,
    us.n_created,
    us.f_minutes
  FROM eligible_users eu
  JOIN user_stats us ON eu.id = us.id
  ORDER BY 
    CASE WHEN sort_metric = 'streak' THEN us.cur_streak END DESC NULLS LAST,
    CASE WHEN sort_metric = 'tasks' THEN us.t_completed END DESC NULLS LAST,
    CASE WHEN sort_metric = 'notes' THEN us.n_created END DESC NULLS LAST,
    us.cur_streak DESC,
    eu.name ASC
  LIMIT limit_count
  OFFSET page_offset;
END;
$$;

-- 5. Create RPC for a single public profile
CREATE OR REPLACE FUNCTION public.get_public_profile(
  target_user_id uuid,
  viewer_tz text
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  bio text,
  current_streak integer,
  longest_streak integer,
  tasks_completed integer,
  notes_created integer,
  focus_minutes integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.avatar_url,
    p.bio,
    (SELECT s.current_streak FROM public.calculate_user_streaks(p.id, viewer_tz) s),
    (SELECT s.longest_streak FROM public.calculate_user_streaks(p.id, viewer_tz) s),
    (SELECT COUNT(*)::integer FROM public.tasks t WHERE t.user_id = p.id AND t.completed = true),
    (SELECT COUNT(*)::integer FROM public.notes n WHERE n.user_id = p.id),
    (SELECT COALESCE(SUM(duration_seconds) / 60, 0)::integer FROM public.focus_sessions f WHERE f.user_id = p.id)
  FROM public.profiles p
  WHERE p.id = target_user_id AND p.community_visible = true;
END;
$$;
