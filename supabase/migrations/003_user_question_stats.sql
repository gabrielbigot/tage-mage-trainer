-- Migration: Add user_question_stats table
-- This table tracks per-question cumulative statistics for questions stored in Notion
-- question_id is TEXT to support Notion page IDs

-- ============================================
-- USER QUESTION STATS TABLE
-- Stores per-question statistics for each user
-- Links to Notion questions via TEXT question_id
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_question_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    question_id TEXT NOT NULL, -- TEXT to support Notion IDs

    -- Answer statistics
    times_answered INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    times_incorrect INTEGER DEFAULT 0,
    last_answered_at TIMESTAMP WITH TIME ZONE,
    average_time_spent NUMERIC DEFAULT 0,

    -- Spaced repetition data
    ease_factor NUMERIC DEFAULT 2.5,
    sr_interval INTEGER DEFAULT 0,
    sr_repetitions INTEGER DEFAULT 0,
    next_review_date TIMESTAMP WITH TIME ZONE,
    last_review_date TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Each user can have only one stats record per question
    UNIQUE(user_id, question_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_question_stats_user_id ON public.user_question_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_question_stats_question_id ON public.user_question_stats(question_id);
CREATE INDEX IF NOT EXISTS idx_user_question_stats_next_review ON public.user_question_stats(next_review_date);
CREATE INDEX IF NOT EXISTS idx_user_question_stats_times_incorrect ON public.user_question_stats(times_incorrect DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.user_question_stats ENABLE ROW LEVEL SECURITY;

-- Users can view their own question stats
CREATE POLICY "Users can view own question stats" ON public.user_question_stats
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own question stats
CREATE POLICY "Users can insert own question stats" ON public.user_question_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own question stats
CREATE POLICY "Users can update own question stats" ON public.user_question_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own question stats
CREATE POLICY "Users can delete own question stats" ON public.user_question_stats
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE TRIGGER update_user_question_stats_updated_at
    BEFORE UPDATE ON public.user_question_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Upsert question stats
-- ============================================
CREATE OR REPLACE FUNCTION public.upsert_question_stats(
    p_user_id UUID,
    p_question_id TEXT,
    p_is_correct BOOLEAN,
    p_time_spent INTEGER DEFAULT 0,
    p_ease_factor NUMERIC DEFAULT NULL,
    p_sr_interval INTEGER DEFAULT NULL,
    p_sr_repetitions INTEGER DEFAULT NULL,
    p_next_review_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_last_review_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_existing RECORD;
    v_new_times_answered INTEGER;
    v_new_times_correct INTEGER;
    v_new_times_incorrect INTEGER;
    v_new_avg_time NUMERIC;
BEGIN
    -- Get existing stats if any
    SELECT * INTO v_existing
    FROM public.user_question_stats
    WHERE user_id = p_user_id AND question_id = p_question_id;

    IF v_existing IS NULL THEN
        -- Insert new record
        INSERT INTO public.user_question_stats (
            user_id, question_id,
            times_answered, times_correct, times_incorrect,
            last_answered_at, average_time_spent,
            ease_factor, sr_interval, sr_repetitions,
            next_review_date, last_review_date
        ) VALUES (
            p_user_id, p_question_id,
            1,
            CASE WHEN p_is_correct THEN 1 ELSE 0 END,
            CASE WHEN p_is_correct THEN 0 ELSE 1 END,
            NOW(),
            p_time_spent,
            COALESCE(p_ease_factor, 2.5),
            COALESCE(p_sr_interval, 0),
            COALESCE(p_sr_repetitions, 0),
            p_next_review_date,
            p_last_review_date
        );
    ELSE
        -- Calculate new values
        v_new_times_answered := COALESCE(v_existing.times_answered, 0) + 1;
        v_new_times_correct := COALESCE(v_existing.times_correct, 0) + CASE WHEN p_is_correct THEN 1 ELSE 0 END;
        v_new_times_incorrect := COALESCE(v_existing.times_incorrect, 0) + CASE WHEN p_is_correct THEN 0 ELSE 1 END;

        -- Calculate running average time
        IF v_existing.times_answered > 0 AND v_existing.average_time_spent > 0 THEN
            v_new_avg_time := (v_existing.average_time_spent * v_existing.times_answered + p_time_spent) / v_new_times_answered;
        ELSE
            v_new_avg_time := p_time_spent;
        END IF;

        -- Update existing record
        UPDATE public.user_question_stats
        SET times_answered = v_new_times_answered,
            times_correct = v_new_times_correct,
            times_incorrect = v_new_times_incorrect,
            last_answered_at = NOW(),
            average_time_spent = v_new_avg_time,
            ease_factor = COALESCE(p_ease_factor, ease_factor),
            sr_interval = COALESCE(p_sr_interval, sr_interval),
            sr_repetitions = COALESCE(p_sr_repetitions, sr_repetitions),
            next_review_date = COALESCE(p_next_review_date, next_review_date),
            last_review_date = COALESCE(p_last_review_date, last_review_date),
            updated_at = NOW()
        WHERE user_id = p_user_id AND question_id = p_question_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
