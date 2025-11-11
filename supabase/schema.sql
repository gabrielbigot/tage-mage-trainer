-- TAGE MAGE Trainer - Database Schema
-- Execute this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of options
    correct_answer INTEGER NOT NULL,
    explanation TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    tags TEXT[], -- Array of tags
    notes TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    -- Statistics
    times_answered INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    times_incorrect INTEGER DEFAULT 0,
    last_answered_at TIMESTAMP WITH TIME ZONE,
    average_time_spent NUMERIC, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training sessions table
CREATE TABLE IF NOT EXISTS public.training_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mode TEXT CHECK (mode IN ('practice', 'exam', 'review', 'flashcards')) DEFAULT 'practice',
    score INTEGER,
    total_time INTEGER, -- in seconds
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question results (many-to-many between sessions and questions)
CREATE TABLE IF NOT EXISTS public.question_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    user_answer INTEGER,
    is_correct BOOLEAN NOT NULL,
    time_spent INTEGER, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Streak tracking
CREATE TABLE IF NOT EXISTS public.user_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_session_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON public.questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_is_favorite ON public.questions(is_favorite);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON public.questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON public.training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_question_results_session_id ON public.question_results(session_id);
CREATE INDEX IF NOT EXISTS idx_question_results_question_id ON public.question_results(question_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Questions policies
CREATE POLICY "Users can view their own questions" ON public.questions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own questions" ON public.questions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own questions" ON public.questions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own questions" ON public.questions
    FOR DELETE USING (auth.uid() = user_id);

-- Training sessions policies
CREATE POLICY "Users can view their own sessions" ON public.training_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON public.training_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.training_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON public.training_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Question results policies
CREATE POLICY "Users can view their own results" ON public.question_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.training_sessions
            WHERE training_sessions.id = question_results.session_id
            AND training_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own results" ON public.question_results
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.training_sessions
            WHERE training_sessions.id = question_results.session_id
            AND training_sessions.user_id = auth.uid()
        )
    );

-- User streaks policies
CREATE POLICY "Users can view their own streak" ON public.user_streaks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak" ON public.user_streaks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak" ON public.user_streaks
    FOR UPDATE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON public.user_streaks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');

    INSERT INTO public.user_streaks (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
