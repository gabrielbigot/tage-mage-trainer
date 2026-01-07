-- Migration: Add Statistics Features
-- This migration adds support for:
-- - Spaced repetition data on questions
-- - Daily challenges tracking
-- - Enhanced streak tracking (weekly activity, total days)
-- - Question type column

-- ===========================================
-- Update training_sessions to support new modes
-- ===========================================
ALTER TABLE public.training_sessions
DROP CONSTRAINT IF EXISTS training_sessions_mode_check;

ALTER TABLE public.training_sessions
ADD CONSTRAINT training_sessions_mode_check
CHECK (mode IN ('practice', 'exam', 'review', 'flashcards', 'sprint', 'daily-challenge', 'spaced-review'));

-- ===========================================
-- Add spaced repetition columns to questions
-- ===========================================
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'standard' CHECK (question_type IN ('standard', 'double-series'));

ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS ease_factor NUMERIC DEFAULT 2.5;

ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS sr_interval INTEGER DEFAULT 0;

ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS sr_repetitions INTEGER DEFAULT 0;

ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS next_review_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS last_review_date TIMESTAMP WITH TIME ZONE;

-- Index for spaced repetition queries
CREATE INDEX IF NOT EXISTS idx_questions_next_review ON public.questions(next_review_date);
CREATE INDEX IF NOT EXISTS idx_questions_type ON public.questions(question_type);

-- ===========================================
-- Enhance user_streaks table
-- ===========================================
ALTER TABLE public.user_streaks
ADD COLUMN IF NOT EXISTS total_days_active INTEGER DEFAULT 0;

ALTER TABLE public.user_streaks
ADD COLUMN IF NOT EXISTS weekly_activity BOOLEAN[] DEFAULT ARRAY[false, false, false, false, false, false, false];

-- ===========================================
-- Create daily_challenges table
-- ===========================================
CREATE TABLE IF NOT EXISTS public.daily_challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    challenge_date DATE NOT NULL,
    score INTEGER,
    total_questions INTEGER DEFAULT 10,
    correct_answers INTEGER DEFAULT 0,
    total_time INTEGER, -- in seconds
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, challenge_date)
);

-- Index for daily challenges
CREATE INDEX IF NOT EXISTS idx_daily_challenges_user_id ON public.daily_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON public.daily_challenges(challenge_date);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_challenges
CREATE POLICY "Users can view their own daily challenges" ON public.daily_challenges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily challenges" ON public.daily_challenges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily challenges" ON public.daily_challenges
    FOR UPDATE USING (auth.uid() = user_id);

-- ===========================================
-- Create tag_stats view for efficient querying
-- ===========================================
CREATE OR REPLACE VIEW public.tag_statistics AS
SELECT
    user_id,
    tag,
    COUNT(*) as question_count,
    SUM(times_answered) as total_answered,
    SUM(times_correct) as total_correct,
    CASE
        WHEN SUM(times_answered) > 0
        THEN ROUND((SUM(times_correct)::NUMERIC / SUM(times_answered)::NUMERIC) * 100)
        ELSE 0
    END as average_score
FROM public.questions, unnest(tags) as tag
GROUP BY user_id, tag;

-- ===========================================
-- Function to update streak with daily tracking
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_today DATE;
    v_yesterday DATE;
    v_last_date DATE;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
    v_total_days INTEGER;
    v_weekly BOOLEAN[];
    v_day_of_week INTEGER;
BEGIN
    v_user_id := NEW.user_id;
    v_today := CURRENT_DATE;
    v_yesterday := v_today - INTERVAL '1 day';
    v_day_of_week := EXTRACT(DOW FROM v_today)::INTEGER; -- 0=Sunday, 6=Saturday

    -- Get current streak data
    SELECT
        last_session_date,
        current_streak,
        longest_streak,
        COALESCE(total_days_active, 0),
        COALESCE(weekly_activity, ARRAY[false, false, false, false, false, false, false])
    INTO v_last_date, v_current_streak, v_longest_streak, v_total_days, v_weekly
    FROM public.user_streaks
    WHERE user_id = v_user_id;

    -- If no streak record exists, create one
    IF v_last_date IS NULL THEN
        INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_session_date, total_days_active, weekly_activity)
        VALUES (v_user_id, 1, 1, v_today, 1,
            ARRAY[v_day_of_week = 0, v_day_of_week = 1, v_day_of_week = 2, v_day_of_week = 3, v_day_of_week = 4, v_day_of_week = 5, v_day_of_week = 6])
        ON CONFLICT (user_id) DO UPDATE SET
            current_streak = 1,
            longest_streak = GREATEST(user_streaks.longest_streak, 1),
            last_session_date = v_today,
            total_days_active = user_streaks.total_days_active + 1,
            weekly_activity = ARRAY[v_day_of_week = 0, v_day_of_week = 1, v_day_of_week = 2, v_day_of_week = 3, v_day_of_week = 4, v_day_of_week = 5, v_day_of_week = 6];
        RETURN NEW;
    END IF;

    -- If already played today, don't update
    IF v_last_date = v_today THEN
        RETURN NEW;
    END IF;

    -- Update weekly activity
    v_weekly[v_day_of_week + 1] := true; -- PostgreSQL arrays are 1-indexed

    -- Calculate new streak
    IF v_last_date = v_yesterday THEN
        v_current_streak := v_current_streak + 1;
    ELSE
        v_current_streak := 1;
        -- Reset weekly activity if more than a week has passed
        IF v_today - v_last_date > 7 THEN
            v_weekly := ARRAY[false, false, false, false, false, false, false];
            v_weekly[v_day_of_week + 1] := true;
        END IF;
    END IF;

    -- Update longest streak
    v_longest_streak := GREATEST(v_longest_streak, v_current_streak);

    -- Update streak record
    UPDATE public.user_streaks
    SET
        current_streak = v_current_streak,
        longest_streak = v_longest_streak,
        last_session_date = v_today,
        total_days_active = v_total_days + 1,
        weekly_activity = v_weekly,
        updated_at = NOW()
    WHERE user_id = v_user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update streak when a session is completed
DROP TRIGGER IF EXISTS trigger_update_streak_on_session ON public.training_sessions;
CREATE TRIGGER trigger_update_streak_on_session
    AFTER INSERT OR UPDATE OF completed_at ON public.training_sessions
    FOR EACH ROW
    WHEN (NEW.completed_at IS NOT NULL)
    EXECUTE FUNCTION public.update_user_streak();

-- ===========================================
-- Function to get comprehensive statistics
-- ===========================================
CREATE OR REPLACE FUNCTION public.get_user_statistics(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_total_questions INTEGER;
    v_total_sessions INTEGER;
    v_total_time INTEGER;
    v_avg_score NUMERIC;
    v_best_score INTEGER;
    v_streak JSONB;
    v_category_stats JSONB;
    v_difficulty_stats JSONB;
    v_type_stats JSONB;
    v_tag_stats JSONB;
BEGIN
    -- Total questions
    SELECT COUNT(*) INTO v_total_questions
    FROM public.questions WHERE user_id = p_user_id;

    -- Session stats
    SELECT
        COUNT(*),
        COALESCE(SUM(total_time), 0),
        COALESCE(AVG(score), 0),
        COALESCE(MAX(score), 0)
    INTO v_total_sessions, v_total_time, v_avg_score, v_best_score
    FROM public.training_sessions
    WHERE user_id = p_user_id AND completed_at IS NOT NULL;

    -- Streak
    SELECT jsonb_build_object(
        'current', COALESCE(current_streak, 0),
        'longest', COALESCE(longest_streak, 0),
        'lastSessionDate', last_session_date,
        'totalDaysActive', COALESCE(total_days_active, 0),
        'weeklyActivity', COALESCE(weekly_activity, ARRAY[false, false, false, false, false, false, false])
    ) INTO v_streak
    FROM public.user_streaks WHERE user_id = p_user_id;

    IF v_streak IS NULL THEN
        v_streak := jsonb_build_object(
            'current', 0,
            'longest', 0,
            'lastSessionDate', NULL,
            'totalDaysActive', 0,
            'weeklyActivity', ARRAY[false, false, false, false, false, false, false]
        );
    END IF;

    -- Category stats
    SELECT jsonb_object_agg(
        category,
        jsonb_build_object(
            'totalAnswered', COALESCE(SUM(times_answered), 0),
            'totalCorrect', COALESCE(SUM(times_correct), 0),
            'averageScore', CASE
                WHEN SUM(times_answered) > 0
                THEN ROUND((SUM(times_correct)::NUMERIC / SUM(times_answered)::NUMERIC) * 100)
                ELSE 0
            END
        )
    ) INTO v_category_stats
    FROM public.questions
    WHERE user_id = p_user_id
    GROUP BY category;

    -- Difficulty stats
    SELECT jsonb_build_object(
        'easy', jsonb_build_object(
            'totalAnswered', COALESCE(SUM(CASE WHEN COALESCE(difficulty, 'medium') = 'easy' THEN times_answered ELSE 0 END), 0),
            'totalCorrect', COALESCE(SUM(CASE WHEN COALESCE(difficulty, 'medium') = 'easy' THEN times_correct ELSE 0 END), 0),
            'averageScore', CASE
                WHEN SUM(CASE WHEN COALESCE(difficulty, 'medium') = 'easy' THEN times_answered ELSE 0 END) > 0
                THEN ROUND((SUM(CASE WHEN COALESCE(difficulty, 'medium') = 'easy' THEN times_correct ELSE 0 END)::NUMERIC /
                    SUM(CASE WHEN COALESCE(difficulty, 'medium') = 'easy' THEN times_answered ELSE 0 END)::NUMERIC) * 100)
                ELSE 0
            END
        ),
        'medium', jsonb_build_object(
            'totalAnswered', COALESCE(SUM(CASE WHEN COALESCE(difficulty, 'medium') = 'medium' THEN times_answered ELSE 0 END), 0),
            'totalCorrect', COALESCE(SUM(CASE WHEN COALESCE(difficulty, 'medium') = 'medium' THEN times_correct ELSE 0 END), 0),
            'averageScore', CASE
                WHEN SUM(CASE WHEN COALESCE(difficulty, 'medium') = 'medium' THEN times_answered ELSE 0 END) > 0
                THEN ROUND((SUM(CASE WHEN COALESCE(difficulty, 'medium') = 'medium' THEN times_correct ELSE 0 END)::NUMERIC /
                    SUM(CASE WHEN COALESCE(difficulty, 'medium') = 'medium' THEN times_answered ELSE 0 END)::NUMERIC) * 100)
                ELSE 0
            END
        ),
        'hard', jsonb_build_object(
            'totalAnswered', COALESCE(SUM(CASE WHEN COALESCE(difficulty, 'medium') = 'hard' THEN times_answered ELSE 0 END), 0),
            'totalCorrect', COALESCE(SUM(CASE WHEN COALESCE(difficulty, 'medium') = 'hard' THEN times_correct ELSE 0 END), 0),
            'averageScore', CASE
                WHEN SUM(CASE WHEN COALESCE(difficulty, 'medium') = 'hard' THEN times_answered ELSE 0 END) > 0
                THEN ROUND((SUM(CASE WHEN COALESCE(difficulty, 'medium') = 'hard' THEN times_correct ELSE 0 END)::NUMERIC /
                    SUM(CASE WHEN COALESCE(difficulty, 'medium') = 'hard' THEN times_answered ELSE 0 END)::NUMERIC) * 100)
                ELSE 0
            END
        )
    ) INTO v_difficulty_stats
    FROM public.questions WHERE user_id = p_user_id;

    -- Question type stats
    SELECT jsonb_build_object(
        'standard', jsonb_build_object(
            'totalAnswered', COALESCE(SUM(CASE WHEN COALESCE(question_type, 'standard') = 'standard' THEN times_answered ELSE 0 END), 0),
            'totalCorrect', COALESCE(SUM(CASE WHEN COALESCE(question_type, 'standard') = 'standard' THEN times_correct ELSE 0 END), 0),
            'averageScore', CASE
                WHEN SUM(CASE WHEN COALESCE(question_type, 'standard') = 'standard' THEN times_answered ELSE 0 END) > 0
                THEN ROUND((SUM(CASE WHEN COALESCE(question_type, 'standard') = 'standard' THEN times_correct ELSE 0 END)::NUMERIC /
                    SUM(CASE WHEN COALESCE(question_type, 'standard') = 'standard' THEN times_answered ELSE 0 END)::NUMERIC) * 100)
                ELSE 0
            END,
            'averageTime', COALESCE(AVG(CASE WHEN COALESCE(question_type, 'standard') = 'standard' THEN average_time_spent ELSE NULL END), 0)
        ),
        'double-series', jsonb_build_object(
            'totalAnswered', COALESCE(SUM(CASE WHEN question_type = 'double-series' THEN times_answered ELSE 0 END), 0),
            'totalCorrect', COALESCE(SUM(CASE WHEN question_type = 'double-series' THEN times_correct ELSE 0 END), 0),
            'averageScore', CASE
                WHEN SUM(CASE WHEN question_type = 'double-series' THEN times_answered ELSE 0 END) > 0
                THEN ROUND((SUM(CASE WHEN question_type = 'double-series' THEN times_correct ELSE 0 END)::NUMERIC /
                    SUM(CASE WHEN question_type = 'double-series' THEN times_answered ELSE 0 END)::NUMERIC) * 100)
                ELSE 0
            END,
            'averageTime', COALESCE(AVG(CASE WHEN question_type = 'double-series' THEN average_time_spent ELSE NULL END), 0)
        )
    ) INTO v_type_stats
    FROM public.questions WHERE user_id = p_user_id;

    -- Tag stats
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'tag', tag,
            'questionCount', question_count,
            'totalAnswered', total_answered,
            'totalCorrect', total_correct,
            'averageScore', average_score
        )
    ), '[]'::jsonb) INTO v_tag_stats
    FROM public.tag_statistics
    WHERE user_id = p_user_id;

    -- Build result
    v_result := jsonb_build_object(
        'totalQuestions', v_total_questions,
        'totalSessions', v_total_sessions,
        'totalTimeSpent', v_total_time,
        'averageScore', ROUND(v_avg_score),
        'bestScore', v_best_score,
        'streak', v_streak,
        'categoryStats', COALESCE(v_category_stats, '{}'::jsonb),
        'difficultyStats', v_difficulty_stats,
        'questionTypeStats', v_type_stats,
        'tagStats', v_tag_stats
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
