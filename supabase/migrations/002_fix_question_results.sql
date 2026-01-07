-- Migration: Fix question_results for Notion questions
-- This migration allows storing results for questions that exist in Notion (not Supabase)

-- ===========================================
-- Drop foreign key constraint on question_results
-- ===========================================
-- We need to allow question_id to reference questions stored in Notion
ALTER TABLE public.question_results
DROP CONSTRAINT IF EXISTS question_results_question_id_fkey;

-- Change question_id to TEXT to support Notion IDs
ALTER TABLE public.question_results
ALTER COLUMN question_id TYPE TEXT;

-- ===========================================
-- Create a separate table for session statistics
-- This stores aggregated stats per session without needing question references
-- ===========================================
CREATE TABLE IF NOT EXISTS public.session_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    total_questions INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    incorrect_answers INTEGER NOT NULL DEFAULT 0,
    score INTEGER NOT NULL DEFAULT 0,
    total_time INTEGER, -- in seconds
    average_time_per_question NUMERIC,
    -- Stats by difficulty
    easy_correct INTEGER DEFAULT 0,
    easy_total INTEGER DEFAULT 0,
    medium_correct INTEGER DEFAULT 0,
    medium_total INTEGER DEFAULT 0,
    hard_correct INTEGER DEFAULT 0,
    hard_total INTEGER DEFAULT 0,
    -- Stats by category (stored as JSONB for flexibility)
    category_stats JSONB DEFAULT '{}',
    -- Stats by tags (stored as JSONB)
    tag_stats JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.session_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own session stats" ON public.session_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own session stats" ON public.session_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_session_stats_user_id ON public.session_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_session_stats_session_id ON public.session_stats(session_id);

-- ===========================================
-- Update get_user_statistics function to use session_stats
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
    v_total_correct INTEGER;
    v_total_answered INTEGER;
    v_streak JSONB;
    v_category_stats JSONB;
    v_difficulty_stats JSONB;
    v_type_stats JSONB;
    v_tag_stats JSONB;
BEGIN
    -- Session stats from training_sessions
    SELECT
        COUNT(*),
        COALESCE(SUM(total_time), 0),
        COALESCE(AVG(score), 0),
        COALESCE(MAX(score), 0)
    INTO v_total_sessions, v_total_time, v_avg_score, v_best_score
    FROM public.training_sessions
    WHERE user_id = p_user_id AND completed_at IS NOT NULL;

    -- Aggregate stats from session_stats
    SELECT
        COALESCE(SUM(total_questions), 0),
        COALESCE(SUM(correct_answers), 0)
    INTO v_total_answered, v_total_correct
    FROM public.session_stats
    WHERE user_id = p_user_id;

    -- Difficulty stats from session_stats
    SELECT jsonb_build_object(
        'easy', jsonb_build_object(
            'totalAnswered', COALESCE(SUM(easy_total), 0),
            'totalCorrect', COALESCE(SUM(easy_correct), 0),
            'averageScore', CASE
                WHEN SUM(easy_total) > 0
                THEN ROUND((SUM(easy_correct)::NUMERIC / SUM(easy_total)::NUMERIC) * 100)
                ELSE 0
            END
        ),
        'medium', jsonb_build_object(
            'totalAnswered', COALESCE(SUM(medium_total), 0),
            'totalCorrect', COALESCE(SUM(medium_correct), 0),
            'averageScore', CASE
                WHEN SUM(medium_total) > 0
                THEN ROUND((SUM(medium_correct)::NUMERIC / SUM(medium_total)::NUMERIC) * 100)
                ELSE 0
            END
        ),
        'hard', jsonb_build_object(
            'totalAnswered', COALESCE(SUM(hard_total), 0),
            'totalCorrect', COALESCE(SUM(hard_correct), 0),
            'averageScore', CASE
                WHEN SUM(hard_total) > 0
                THEN ROUND((SUM(hard_correct)::NUMERIC / SUM(hard_total)::NUMERIC) * 100)
                ELSE 0
            END
        )
    ) INTO v_difficulty_stats
    FROM public.session_stats
    WHERE user_id = p_user_id;

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

    -- Aggregate category stats from all sessions
    SELECT COALESCE(
        jsonb_object_agg(cat_key, cat_value),
        '{}'::jsonb
    ) INTO v_category_stats
    FROM (
        SELECT
            key as cat_key,
            jsonb_build_object(
                'totalAnswered', SUM((value->>'totalAnswered')::int),
                'totalCorrect', SUM((value->>'totalCorrect')::int),
                'averageScore', CASE
                    WHEN SUM((value->>'totalAnswered')::int) > 0
                    THEN ROUND((SUM((value->>'totalCorrect')::int)::NUMERIC / SUM((value->>'totalAnswered')::int)::NUMERIC) * 100)
                    ELSE 0
                END
            ) as cat_value
        FROM public.session_stats, jsonb_each(category_stats)
        WHERE user_id = p_user_id
        GROUP BY key
    ) sub;

    -- Question type stats (use defaults for now)
    v_type_stats := jsonb_build_object(
        'standard', jsonb_build_object(
            'totalAnswered', v_total_answered,
            'totalCorrect', v_total_correct,
            'averageScore', CASE WHEN v_total_answered > 0 THEN ROUND((v_total_correct::NUMERIC / v_total_answered::NUMERIC) * 100) ELSE 0 END,
            'averageTime', 0
        ),
        'double-series', jsonb_build_object(
            'totalAnswered', 0,
            'totalCorrect', 0,
            'averageScore', 0,
            'averageTime', 0
        )
    );

    -- Aggregate tag stats from all sessions
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'tag', tag_key,
                'questionCount', 0,
                'totalAnswered', total_answered,
                'totalCorrect', total_correct,
                'averageScore', CASE WHEN total_answered > 0 THEN ROUND((total_correct::NUMERIC / total_answered::NUMERIC) * 100) ELSE 0 END
            )
        ),
        '[]'::jsonb
    ) INTO v_tag_stats
    FROM (
        SELECT
            key as tag_key,
            SUM((value->>'totalAnswered')::int) as total_answered,
            SUM((value->>'totalCorrect')::int) as total_correct
        FROM public.session_stats, jsonb_each(tag_stats)
        WHERE user_id = p_user_id
        GROUP BY key
    ) sub;

    -- Build result
    v_result := jsonb_build_object(
        'totalQuestions', v_total_answered,
        'totalSessions', v_total_sessions,
        'totalTimeSpent', v_total_time,
        'averageScore', ROUND(v_avg_score),
        'bestScore', v_best_score,
        'streak', v_streak,
        'categoryStats', COALESCE(v_category_stats, '{}'::jsonb),
        'difficultyStats', v_difficulty_stats,
        'questionTypeStats', v_type_stats,
        'tagStats', COALESCE(v_tag_stats, '[]'::jsonb)
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
