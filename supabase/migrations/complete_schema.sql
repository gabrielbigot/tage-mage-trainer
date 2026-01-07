-- ============================================
-- TAGE MAGE Trainer - Complete Database Schema
-- ============================================
-- This schema supports:
-- - Questions stored in Notion (question IDs are TEXT)
-- - All statistics stored in Supabase
-- - All session modes: practice, exam, sprint, daily-challenge, spaced-review, review, flashcards
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. TRAINING SESSIONS TABLE
-- Stores all training sessions regardless of mode
-- ============================================
DROP TABLE IF EXISTS public.training_sessions CASCADE;
CREATE TABLE public.training_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mode TEXT NOT NULL DEFAULT 'practice',
    score INTEGER,
    total_time INTEGER, -- in seconds
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_mode CHECK (mode IN ('practice', 'exam', 'review', 'flashcards', 'sprint', 'daily-challenge', 'spaced-review'))
);

-- ============================================
-- 3. SESSION STATS TABLE
-- Stores aggregated statistics per session
-- ============================================
DROP TABLE IF EXISTS public.session_stats CASCADE;
CREATE TABLE public.session_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Basic stats
    total_questions INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    incorrect_answers INTEGER NOT NULL DEFAULT 0,
    score INTEGER NOT NULL DEFAULT 0,
    total_time INTEGER DEFAULT 0,
    average_time_per_question NUMERIC DEFAULT 0,

    -- Stats by difficulty
    easy_correct INTEGER DEFAULT 0,
    easy_total INTEGER DEFAULT 0,
    medium_correct INTEGER DEFAULT 0,
    medium_total INTEGER DEFAULT 0,
    hard_correct INTEGER DEFAULT 0,
    hard_total INTEGER DEFAULT 0,

    -- Stats by category (JSONB for flexibility)
    -- Format: {"Calcul": {"totalAnswered": 5, "totalCorrect": 3}, ...}
    category_stats JSONB DEFAULT '{}',

    -- Stats by tags (JSONB for flexibility)
    -- Format: {"arithmétique": {"totalAnswered": 3, "totalCorrect": 2}, ...}
    tag_stats JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. QUESTION RESULTS TABLE
-- Stores individual question results (question_id is TEXT for Notion compatibility)
-- ============================================
DROP TABLE IF EXISTS public.question_results CASCADE;
CREATE TABLE public.question_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE NOT NULL,
    question_id TEXT NOT NULL, -- TEXT to support Notion IDs
    user_answer INTEGER,
    is_correct BOOLEAN NOT NULL,
    time_spent INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. USER STREAKS TABLE
-- Tracks user activity streaks
-- ============================================
DROP TABLE IF EXISTS public.user_streaks CASCADE;
CREATE TABLE public.user_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_session_date DATE,
    total_days_active INTEGER DEFAULT 0,
    weekly_activity BOOLEAN[] DEFAULT ARRAY[false, false, false, false, false, false, false],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. DAILY CHALLENGES TABLE
-- Tracks daily challenge completions
-- ============================================
DROP TABLE IF EXISTS public.daily_challenges CASCADE;
CREATE TABLE public.daily_challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    challenge_date DATE NOT NULL,
    score INTEGER,
    total_questions INTEGER DEFAULT 10,
    correct_answers INTEGER DEFAULT 0,
    total_time INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, challenge_date)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_training_sessions_user_id ON public.training_sessions(user_id);
CREATE INDEX idx_training_sessions_mode ON public.training_sessions(mode);
CREATE INDEX idx_training_sessions_completed_at ON public.training_sessions(completed_at);

CREATE INDEX idx_session_stats_user_id ON public.session_stats(user_id);
CREATE INDEX idx_session_stats_session_id ON public.session_stats(session_id);

CREATE INDEX idx_question_results_session_id ON public.question_results(session_id);
CREATE INDEX idx_question_results_question_id ON public.question_results(question_id);

CREATE INDEX idx_daily_challenges_user_id ON public.daily_challenges(user_id);
CREATE INDEX idx_daily_challenges_date ON public.daily_challenges(challenge_date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Training sessions policies
CREATE POLICY "Users can view own sessions" ON public.training_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.training_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.training_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.training_sessions FOR DELETE USING (auth.uid() = user_id);

-- Session stats policies
CREATE POLICY "Users can view own session stats" ON public.session_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own session stats" ON public.session_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Question results policies
CREATE POLICY "Users can view own results" ON public.question_results FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.training_sessions WHERE id = question_results.session_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own results" ON public.question_results FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.training_sessions WHERE id = question_results.session_id AND user_id = auth.uid())
);

-- User streaks policies
CREATE POLICY "Users can view own streak" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streak" ON public.user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streak" ON public.user_streaks FOR UPDATE USING (auth.uid() = user_id);

-- Daily challenges policies
CREATE POLICY "Users can view own challenges" ON public.daily_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenges" ON public.daily_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenges" ON public.daily_challenges FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at
    BEFORE UPDATE ON public.user_streaks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Handle new user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, total_days_active)
    VALUES (NEW.id, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Update streak when session completed
-- ============================================
CREATE OR REPLACE FUNCTION public.update_streak_on_session()
RETURNS TRIGGER AS $$
DECLARE
    v_today DATE;
    v_yesterday DATE;
    v_last_date DATE;
    v_current INTEGER;
    v_longest INTEGER;
    v_total INTEGER;
    v_weekly BOOLEAN[];
    v_day_index INTEGER;
BEGIN
    -- Only trigger on completion
    IF NEW.completed_at IS NULL THEN
        RETURN NEW;
    END IF;

    v_today := CURRENT_DATE;
    v_yesterday := v_today - INTERVAL '1 day';
    v_day_index := EXTRACT(DOW FROM v_today)::INTEGER + 1; -- 1=Sunday, 7=Saturday

    -- Get or create streak record
    SELECT last_session_date, current_streak, longest_streak, total_days_active,
           COALESCE(weekly_activity, ARRAY[false,false,false,false,false,false,false])
    INTO v_last_date, v_current, v_longest, v_total, v_weekly
    FROM public.user_streaks
    WHERE user_id = NEW.user_id;

    -- If no record, create one
    IF v_last_date IS NULL THEN
        v_weekly := ARRAY[false,false,false,false,false,false,false];
        v_weekly[v_day_index] := true;

        INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_session_date, total_days_active, weekly_activity)
        VALUES (NEW.user_id, 1, 1, v_today, 1, v_weekly)
        ON CONFLICT (user_id) DO UPDATE SET
            current_streak = 1,
            longest_streak = GREATEST(user_streaks.longest_streak, 1),
            last_session_date = v_today,
            total_days_active = user_streaks.total_days_active + 1,
            weekly_activity = v_weekly,
            updated_at = NOW();
        RETURN NEW;
    END IF;

    -- Already played today
    IF v_last_date = v_today THEN
        RETURN NEW;
    END IF;

    -- Update weekly activity
    v_weekly[v_day_index] := true;

    -- Calculate new streak
    IF v_last_date = v_yesterday THEN
        v_current := COALESCE(v_current, 0) + 1;
    ELSE
        v_current := 1;
        -- Reset weekly if more than a week
        IF v_today - v_last_date > 7 THEN
            v_weekly := ARRAY[false,false,false,false,false,false,false];
            v_weekly[v_day_index] := true;
        END IF;
    END IF;

    v_longest := GREATEST(COALESCE(v_longest, 0), v_current);
    v_total := COALESCE(v_total, 0) + 1;

    UPDATE public.user_streaks
    SET current_streak = v_current,
        longest_streak = v_longest,
        last_session_date = v_today,
        total_days_active = v_total,
        weekly_activity = v_weekly,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_streak ON public.training_sessions;
CREATE TRIGGER trigger_update_streak
    AFTER INSERT OR UPDATE OF completed_at ON public.training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_streak_on_session();

-- ============================================
-- Done!
-- ============================================
-- After running this script:
-- 1. All training sessions will be stored in training_sessions
-- 2. Aggregated stats will be stored in session_stats
-- 3. Individual question results in question_results
-- 4. Streaks auto-update when sessions complete
-- 5. Daily challenges tracked in daily_challenges
-- ============================================
