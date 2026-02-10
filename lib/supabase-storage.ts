import { createClient } from "@/lib/supabase/client";
import { Question, TrainingSession, QuestionResult, Statistics, DifficultyLevel, SessionMode, SpacedRepetitionData, DailyChallenge, StreakData, QuestionType } from "./types";

export const supabaseStorage = {
  // Image upload/delete
  async uploadImage(file: File): Promise<string | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    // Create unique filename with user ID folder
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('question-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error("Error uploading image:", error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('question-images')
      .getPublicUrl(data.path);

    return publicUrl;
  },

  async deleteImage(imageUrl: string): Promise<void> {
    const supabase = createClient();

    // Extract path from URL
    const url = new URL(imageUrl);
    const path = url.pathname.split('/question-images/')[1];

    if (!path) return;

    const { error } = await supabase.storage
      .from('question-images')
      .remove([path]);

    if (error) {
      console.error("Error deleting image:", error);
    }
  },

  // Questions
  async getQuestions(): Promise<Question[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching questions:", error);
      return [];
    }

    return (data || []).map(q => ({
      id: q.id,
      category: q.category,
      question: q.question,
      createdAt: new Date(q.created_at).getTime(),
      options: q.options as string[],
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      tags: q.tags || undefined,
      notes: q.notes || undefined,
      difficulty: q.difficulty as DifficultyLevel | undefined,
      questionType: (q.question_type || "standard") as QuestionType,
      timesAnswered: q.times_answered || undefined,
      timesCorrect: q.times_correct || undefined,
      timesIncorrect: q.times_incorrect || undefined,
      lastAnsweredAt: q.last_answered_at ? new Date(q.last_answered_at).getTime() : undefined,
      averageTimeSpent: q.average_time_spent || undefined,
      isFavorite: q.is_favorite || false,
      imageUrl: q.image_url || undefined,
      spacedRepetition: q.ease_factor ? {
        easeFactor: q.ease_factor,
        interval: q.sr_interval || 0,
        repetitions: q.sr_repetitions || 0,
        nextReviewDate: q.next_review_date ? new Date(q.next_review_date).getTime() : Date.now(),
        lastReviewDate: q.last_review_date ? new Date(q.last_review_date).getTime() : undefined,
      } : undefined,
    }));
  },

  async addQuestion(question: Omit<Question, "id" | "createdAt">): Promise<Question | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("questions")
      .insert({
        user_id: user.id,
        category: question.category,
        question: question.question,
        options: question.options,
        correct_answer: question.correctAnswer,
        explanation: question.explanation,
        difficulty: question.difficulty,
        question_type: question.questionType || "standard",
        tags: question.tags,
        notes: question.notes,
        is_favorite: question.isFavorite,
        image_url: question.imageUrl,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding question:", error);
      return null;
    }

    return {
      id: data.id,
      category: data.category,
      question: data.question,
      options: data.options as string[],
      correctAnswer: data.correct_answer,
      explanation: data.explanation,
      createdAt: new Date(data.created_at).getTime(),
      difficulty: data.difficulty as DifficultyLevel | undefined,
      questionType: (data.question_type || "standard") as QuestionType,
      tags: data.tags || undefined,
      notes: data.notes || undefined,
      isFavorite: data.is_favorite || false,
      imageUrl: data.image_url || undefined,
    };
  },

  async updateQuestion(id: string, updates: Partial<Question>): Promise<void> {
    const supabase = createClient();

    const dbUpdates: Record<string, unknown> = {};
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.question) dbUpdates.question = updates.question;
    if (updates.options) dbUpdates.options = updates.options;
    if (updates.correctAnswer !== undefined) dbUpdates.correct_answer = updates.correctAnswer;
    if (updates.explanation !== undefined) dbUpdates.explanation = updates.explanation;
    if (updates.difficulty) dbUpdates.difficulty = updates.difficulty;
    if (updates.questionType) dbUpdates.question_type = updates.questionType;
    if (updates.tags) dbUpdates.tags = updates.tags;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.timesAnswered !== undefined) dbUpdates.times_answered = updates.timesAnswered;
    if (updates.timesCorrect !== undefined) dbUpdates.times_correct = updates.timesCorrect;
    if (updates.timesIncorrect !== undefined) dbUpdates.times_incorrect = updates.timesIncorrect;
    if (updates.lastAnsweredAt) dbUpdates.last_answered_at = new Date(updates.lastAnsweredAt).toISOString();
    if (updates.averageTimeSpent !== undefined) dbUpdates.average_time_spent = updates.averageTimeSpent;

    // Spaced repetition data
    if (updates.spacedRepetition) {
      dbUpdates.ease_factor = updates.spacedRepetition.easeFactor;
      dbUpdates.sr_interval = updates.spacedRepetition.interval;
      dbUpdates.sr_repetitions = updates.spacedRepetition.repetitions;
      dbUpdates.next_review_date = new Date(updates.spacedRepetition.nextReviewDate).toISOString();
      if (updates.spacedRepetition.lastReviewDate) {
        dbUpdates.last_review_date = new Date(updates.spacedRepetition.lastReviewDate).toISOString();
      }
    }

    const { error } = await supabase
      .from("questions")
      .update(dbUpdates)
      .eq("id", id);

    if (error) {
      console.error("Error updating question:", error);
    }
  },

  async deleteQuestion(id: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting question:", error);
    }
  },

  async getQuestionsByCategory(category: string): Promise<Question[]> {
    const questions = await this.getQuestions();
    return questions.filter(q => q.category === category);
  },

  async getRandomQuestions(count: number): Promise<Question[]> {
    const questions = await this.getQuestions();
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },

  async getQuestionsByDifficulty(difficulty: DifficultyLevel): Promise<Question[]> {
    const questions = await this.getQuestions();
    return questions.filter(q => q.difficulty === difficulty);
  },

  async getFavoriteQuestions(): Promise<Question[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_favorite", true);

    if (error) {
      console.error("Error fetching favorites:", error);
      return [];
    }

    return (data || []).map(q => ({
      ...q,
      createdAt: new Date(q.created_at).getTime(),
      options: q.options as string[],
      correctAnswer: q.correct_answer,
      tags: q.tags || undefined,
      difficulty: q.difficulty as DifficultyLevel | undefined,
      isFavorite: true,
    }));
  },

  async getQuestionsByTags(tags: string[]): Promise<Question[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("user_id", user.id)
      .overlaps("tags", tags);

    if (error) {
      console.error("Error fetching by tags:", error);
      return [];
    }

    return (data || []).map(q => ({
      ...q,
      createdAt: new Date(q.created_at).getTime(),
      options: q.options as string[],
      correctAnswer: q.correct_answer,
      tags: q.tags || undefined,
      difficulty: q.difficulty as DifficultyLevel | undefined,
    }));
  },

  async toggleFavorite(id: string): Promise<void> {
    const supabase = createClient();

    const { data: question } = await supabase
      .from("questions")
      .select("is_favorite")
      .eq("id", id)
      .single();

    if (!question) return;

    await supabase
      .from("questions")
      .update({ is_favorite: !question.is_favorite })
      .eq("id", id);
  },

  async getIncorrectQuestions(minErrors: number = 1): Promise<Question[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("user_id", user.id)
      .gte("times_incorrect", minErrors)
      .order("times_incorrect", { ascending: false });

    if (error) {
      console.error("Error fetching incorrect questions:", error);
      return [];
    }

    return (data || []).map(q => ({
      ...q,
      createdAt: new Date(q.created_at).getTime(),
      options: q.options as string[],
      correctAnswer: q.correct_answer,
      tags: q.tags || undefined,
      difficulty: q.difficulty as DifficultyLevel | undefined,
      timesAnswered: q.times_answered,
      timesCorrect: q.times_correct,
      timesIncorrect: q.times_incorrect,
    }));
  },

  // Sessions
  async createSession(questions: Question[], mode: SessionMode = "practice"): Promise<string> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("training_sessions")
      .insert({
        user_id: user.id,
        mode,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating session:", error);
      throw error;
    }

    return data.id;
  },

  async completeSession(
    sessionId: string,
    results: QuestionResult[],
    totalTime: number
  ): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error("User not authenticated");
      return;
    }

    const correctAnswers = results.filter(r => r.isCorrect).length;
    const score = Math.round((correctAnswers / results.length) * 100);

    // Update session
    const { error: sessionError } = await supabase
      .from("training_sessions")
      .update({
        score,
        total_time: totalTime,
        total_questions: results.length,
        correct_answers: correctAnswers,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (sessionError) {
      console.error("Error updating session:", sessionError);
    }

    // Calculate stats by difficulty
    let easyCorrect = 0, easyTotal = 0;
    let mediumCorrect = 0, mediumTotal = 0;
    let hardCorrect = 0, hardTotal = 0;
    const categoryStats: Record<string, { totalAnswered: number; totalCorrect: number }> = {};
    const tagStats: Record<string, { totalAnswered: number; totalCorrect: number }> = {};

    for (const result of results) {
      const question = result.question;
      if (!question) continue;

      // Difficulty stats
      const difficulty = question.difficulty || "medium";
      if (difficulty === "easy") {
        easyTotal++;
        if (result.isCorrect) easyCorrect++;
      } else if (difficulty === "medium") {
        mediumTotal++;
        if (result.isCorrect) mediumCorrect++;
      } else if (difficulty === "hard") {
        hardTotal++;
        if (result.isCorrect) hardCorrect++;
      }

      // Category stats
      const category = question.category;
      if (category) {
        if (!categoryStats[category]) {
          categoryStats[category] = { totalAnswered: 0, totalCorrect: 0 };
        }
        categoryStats[category].totalAnswered++;
        if (result.isCorrect) categoryStats[category].totalCorrect++;
      }

      // Tag stats
      if (question.tags) {
        for (const tag of question.tags) {
          if (!tagStats[tag]) {
            tagStats[tag] = { totalAnswered: 0, totalCorrect: 0 };
          }
          tagStats[tag].totalAnswered++;
          if (result.isCorrect) tagStats[tag].totalCorrect++;
        }
      }
    }

    // Insert aggregated session stats
    const { error: statsError } = await supabase
      .from("session_stats")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        total_questions: results.length,
        correct_answers: correctAnswers,
        incorrect_answers: results.length - correctAnswers,
        score,
        total_time: totalTime,
        average_time_per_question: results.length > 0 ? totalTime / results.length : 0,
        easy_correct: easyCorrect,
        easy_total: easyTotal,
        medium_correct: mediumCorrect,
        medium_total: mediumTotal,
        hard_correct: hardCorrect,
        hard_total: hardTotal,
        category_stats: categoryStats,
        tag_stats: tagStats,
      });

    if (statsError) {
      console.error("Error inserting session stats:", statsError);
    }

    // Also insert individual question results (without foreign key constraint)
    const questionResults = results.map(r => ({
      session_id: sessionId,
      question_id: r.questionId, // Now stored as TEXT, works with Notion IDs
      user_answer: r.userAnswer,
      is_correct: r.isCorrect,
      time_spent: r.timeSpent || 0,
    }));

    const { error: resultsError } = await supabase
      .from("question_results")
      .insert(questionResults);

    if (resultsError) {
      console.error("Error inserting question results:", resultsError);
    }

    // Update per-question cumulative stats
    for (const result of results) {
      await this.updateQuestionStats(
        result.questionId,
        result.isCorrect,
        result.timeSpent || 0
      );
    }

    // Update streak
    await this.updateStreak();
  },

  async updateStreak(): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    const { data: streak } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!streak) {
      await supabase
        .from("user_streaks")
        .insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_session_date: today,
        });
      return;
    }

    const lastDate = streak.last_session_date;
    if (lastDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newCurrent = 1;
    if (lastDate === yesterdayStr) {
      newCurrent = (streak.current_streak || 0) + 1;
    }

    const newLongest = Math.max(streak.longest_streak || 0, newCurrent);

    await supabase
      .from("user_streaks")
      .update({
        current_streak: newCurrent,
        longest_streak: newLongest,
        last_session_date: today,
      })
      .eq("user_id", user.id);
  },

  async getStreak(): Promise<{ current: number; longest: number; lastSessionDate?: string; totalDaysActive: number; weeklyActivity: boolean[] }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { current: 0, longest: 0, totalDaysActive: 0, weeklyActivity: [false, false, false, false, false, false, false] };

    const { data: streak } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!streak) return { current: 0, longest: 0, totalDaysActive: 0, weeklyActivity: [false, false, false, false, false, false, false] };

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let current = streak.current_streak || 0;
    if (streak.last_session_date !== today && streak.last_session_date !== yesterdayStr) {
      current = 0;
    }

    return {
      current,
      longest: streak.longest_streak || 0,
      lastSessionDate: streak.last_session_date,
      totalDaysActive: streak.total_days_active || 0,
      weeklyActivity: streak.weekly_activity || [false, false, false, false, false, false, false],
    };
  },

  async getStatistics(): Promise<Statistics> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const emptyStats: Statistics = {
      totalQuestions: 0,
      totalSessions: 0,
      totalTimeSpent: 0,
      averageScore: 0,
      bestScore: 0,
      recentSessions: [],
      categoryStats: {},
      difficultyStats: {
        easy: { totalAnswered: 0, totalCorrect: 0, averageScore: 0 },
        medium: { totalAnswered: 0, totalCorrect: 0, averageScore: 0 },
        hard: { totalAnswered: 0, totalCorrect: 0, averageScore: 0 },
      },
      questionTypeStats: {
        "standard": { totalAnswered: 0, totalCorrect: 0, averageScore: 0, averageTime: 0 },
        "double-series": { totalAnswered: 0, totalCorrect: 0, averageScore: 0, averageTime: 0 },
        "conditions-minimales": { totalAnswered: 0, totalCorrect: 0, averageScore: 0, averageTime: 0 },
        "graphic-series": { totalAnswered: 0, totalCorrect: 0, averageScore: 0, averageTime: 0 },
      },
    };

    if (!user) {
      return emptyStats;
    }

    // Get completed sessions
    const { data: sessions } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false });

    const completedSessions = sessions || [];

    // Get aggregated stats from session_stats table
    const { data: sessionStats } = await supabase
      .from("session_stats")
      .select("*")
      .eq("user_id", user.id);

    const allStats = sessionStats || [];

    // Aggregate difficulty stats from session_stats
    const difficultyStats: Record<DifficultyLevel, { totalAnswered: number; totalCorrect: number; averageScore: number }> = {
      easy: { totalAnswered: 0, totalCorrect: 0, averageScore: 0 },
      medium: { totalAnswered: 0, totalCorrect: 0, averageScore: 0 },
      hard: { totalAnswered: 0, totalCorrect: 0, averageScore: 0 },
    };

    let totalQuestionsAnswered = 0;
    let totalCorrectAnswers = 0;

    allStats.forEach(stat => {
      difficultyStats.easy.totalAnswered += stat.easy_total || 0;
      difficultyStats.easy.totalCorrect += stat.easy_correct || 0;
      difficultyStats.medium.totalAnswered += stat.medium_total || 0;
      difficultyStats.medium.totalCorrect += stat.medium_correct || 0;
      difficultyStats.hard.totalAnswered += stat.hard_total || 0;
      difficultyStats.hard.totalCorrect += stat.hard_correct || 0;
      totalQuestionsAnswered += stat.total_questions || 0;
      totalCorrectAnswers += stat.correct_answers || 0;
    });

    // Calculate average scores for difficulty
    Object.keys(difficultyStats).forEach(diff => {
      const d = diff as DifficultyLevel;
      difficultyStats[d].averageScore = difficultyStats[d].totalAnswered > 0
        ? Math.round((difficultyStats[d].totalCorrect / difficultyStats[d].totalAnswered) * 100)
        : 0;
    });

    // Aggregate category stats from session_stats
    const categoryStats: Record<string, { totalAnswered: number; totalCorrect: number; averageScore: number }> = {};
    allStats.forEach(stat => {
      const catStats = stat.category_stats as Record<string, { totalAnswered: number; totalCorrect: number }> || {};
      Object.entries(catStats).forEach(([cat, data]) => {
        if (!categoryStats[cat]) {
          categoryStats[cat] = { totalAnswered: 0, totalCorrect: 0, averageScore: 0 };
        }
        categoryStats[cat].totalAnswered += data.totalAnswered || 0;
        categoryStats[cat].totalCorrect += data.totalCorrect || 0;
      });
    });

    Object.keys(categoryStats).forEach(cat => {
      categoryStats[cat].averageScore = categoryStats[cat].totalAnswered > 0
        ? Math.round((categoryStats[cat].totalCorrect / categoryStats[cat].totalAnswered) * 100)
        : 0;
    });

    // Aggregate tag stats from session_stats
    const tagStatsMap: Record<string, { totalAnswered: number; totalCorrect: number }> = {};
    allStats.forEach(stat => {
      const tStats = stat.tag_stats as Record<string, { totalAnswered: number; totalCorrect: number }> || {};
      Object.entries(tStats).forEach(([tag, data]) => {
        if (!tagStatsMap[tag]) {
          tagStatsMap[tag] = { totalAnswered: 0, totalCorrect: 0 };
        }
        tagStatsMap[tag].totalAnswered += data.totalAnswered || 0;
        tagStatsMap[tag].totalCorrect += data.totalCorrect || 0;
      });
    });

    const tagStats = Object.entries(tagStatsMap)
      .map(([tag, data]) => ({
        tag,
        totalAnswered: data.totalAnswered,
        totalCorrect: data.totalCorrect,
        averageScore: data.totalAnswered > 0
          ? Math.round((data.totalCorrect / data.totalAnswered) * 100)
          : 0,
      }))
      .filter(t => t.totalAnswered > 0)
      .sort((a, b) => b.totalAnswered - a.totalAnswered);

    // Calculate overall stats
    const totalTimeSpent = completedSessions.reduce((sum, s) => sum + (s.total_time || 0), 0);
    const averageScore = completedSessions.length > 0
      ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length)
      : 0;
    const bestScore = completedSessions.length > 0
      ? Math.max(...completedSessions.map(s => s.score || 0))
      : 0;

    const recentSessions: TrainingSession[] = completedSessions.slice(0, 10).map(s => ({
      id: s.id,
      questions: [],
      currentIndex: 0,
      answers: [],
      startedAt: new Date(s.created_at).getTime(),
      completedAt: s.completed_at ? new Date(s.completed_at).getTime() : undefined,
      mode: s.mode as SessionMode,
      score: s.score,
      totalTime: s.total_time,
      totalQuestions: s.total_questions || 0,
      correctAnswers: s.correct_answers || 0,
    }));

    // Question type stats
    const questionTypeStats: Record<string, { totalAnswered: number; totalCorrect: number; averageScore: number; averageTime: number }> = {
      "standard": {
        totalAnswered: totalQuestionsAnswered,
        totalCorrect: totalCorrectAnswers,
        averageScore: totalQuestionsAnswered > 0 ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100) : 0,
        averageTime: totalQuestionsAnswered > 0 ? Math.round(totalTimeSpent / totalQuestionsAnswered) : 0
      },
      "double-series": { totalAnswered: 0, totalCorrect: 0, averageScore: 0, averageTime: 0 },
      "conditions-minimales": { totalAnswered: 0, totalCorrect: 0, averageScore: 0, averageTime: 0 },
    };

    return {
      totalQuestions: totalQuestionsAnswered,
      totalSessions: completedSessions.length,
      totalTimeSpent,
      averageScore,
      bestScore,
      recentSessions,
      categoryStats,
      difficultyStats,
      questionTypeStats: questionTypeStats as Record<QuestionType, { totalAnswered: number; totalCorrect: number; averageScore: number; averageTime: number }>,
      streak: await this.getStreak(),
      tagStats,
    };
  },

  // Get all sessions with pagination
  async getAllSessions(limit: number = 20, offset: number = 0): Promise<{
    sessions: TrainingSession[];
    total: number;
    hasMore: boolean;
  }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { sessions: [], total: 0, hasMore: false };
    }

    // Get total count
    const { count } = await supabase
      .from("training_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("completed_at", "is", null);

    const total = count || 0;

    // Get paginated sessions
    const { data, error } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching sessions:", error);
      return { sessions: [], total: 0, hasMore: false };
    }

    const sessions: TrainingSession[] = (data || []).map(s => ({
      id: s.id,
      questions: [],
      currentIndex: 0,
      answers: [],
      startedAt: new Date(s.created_at).getTime(),
      completedAt: s.completed_at ? new Date(s.completed_at).getTime() : undefined,
      mode: s.mode as SessionMode,
      score: s.score,
      totalTime: s.total_time,
      totalQuestions: s.total_questions || 0,
      correctAnswers: s.correct_answers || 0,
    }));

    return {
      sessions,
      total,
      hasMore: offset + limit < total,
    };
  },

  // Get session details with question results
  async getSessionDetails(sessionId: string): Promise<{
    session: TrainingSession;
    results: Array<{
      questionId: string;
      userAnswer: number | null;
      isCorrect: boolean;
      timeSpent: number;
    }>;
  } | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Get session
    const { data: sessionData, error: sessionError } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !sessionData) {
      console.error("Error fetching session:", sessionError);
      return null;
    }

    // Get question results
    const { data: resultsData, error: resultsError } = await supabase
      .from("question_results")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (resultsError) {
      console.error("Error fetching question results:", resultsError);
      return null;
    }

    const session: TrainingSession = {
      id: sessionData.id,
      questions: [],
      currentIndex: 0,
      answers: [],
      startedAt: new Date(sessionData.created_at).getTime(),
      completedAt: sessionData.completed_at ? new Date(sessionData.completed_at).getTime() : undefined,
      mode: sessionData.mode as SessionMode,
      score: sessionData.score,
      totalTime: sessionData.total_time,
      totalQuestions: sessionData.total_questions || 0,
      correctAnswers: sessionData.correct_answers || 0,
    };

    const results = (resultsData || []).map(r => ({
      questionId: r.question_id,
      userAnswer: r.user_answer,
      isCorrect: r.is_correct,
      timeSpent: r.time_spent || 0,
    }));

    return { session, results };
  },

  // Export/Import
  async exportData(): Promise<string> {
    const questions = await this.getQuestions();

    return JSON.stringify({
      questions,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  },

  async importData(jsonData: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = JSON.parse(jsonData);

      if (!data.questions || !Array.isArray(data.questions)) {
        return { success: false, message: "Format invalide : 'questions' manquant ou incorrect" };
      }

      let imported = 0;
      for (const q of data.questions) {
        try {
          await this.addQuestion({
            category: q.category,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            tags: q.tags,
            notes: q.notes,
            isFavorite: q.isFavorite,
          });
          imported++;
        } catch (error) {
          console.error("Error importing question:", error);
        }
      }

      return {
        success: true,
        message: `${imported} question(s) importée(s)`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erreur lors de l'import : format JSON invalide",
      };
    }
  },

  // Daily Challenges
  async getDailyChallenge(date?: string): Promise<DailyChallenge | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const challengeDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from("daily_challenges")
      .select("*")
      .eq("user_id", user.id)
      .eq("challenge_date", challengeDate)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      date: data.challenge_date,
      questions: [], // Questions are generated dynamically
      targetScore: 70,
      completed: !!data.completed_at,
      score: data.score,
      timeSpent: data.total_time,
      completedAt: data.completed_at ? new Date(data.completed_at).getTime() : undefined,
    };
  },

  async saveDailyChallenge(challenge: DailyChallenge): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("daily_challenges")
      .upsert({
        user_id: user.id,
        challenge_date: challenge.date,
        score: challenge.score,
        total_questions: challenge.questions.length,
        correct_answers: challenge.score ? Math.round((challenge.score / 100) * challenge.questions.length) : 0,
        total_time: challenge.timeSpent,
        completed_at: challenge.completed ? new Date().toISOString() : null,
      }, {
        onConflict: 'user_id,challenge_date',
      });

    if (error) {
      console.error("Error saving daily challenge:", error);
    }
  },

  async getDailyChallengeHistory(limit: number = 30): Promise<DailyChallenge[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("daily_challenges")
      .select("*")
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .order("challenge_date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching challenge history:", error);
      return [];
    }

    return (data || []).map(d => ({
      id: d.id,
      date: d.challenge_date,
      questions: [],
      targetScore: 70,
      completed: true,
      score: d.score,
      timeSpent: d.total_time,
      completedAt: d.completed_at ? new Date(d.completed_at).getTime() : undefined,
    }));
  },

  // Get questions due for spaced repetition review
  async getQuestionsForReview(): Promise<Question[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("user_id", user.id)
      .not("next_review_date", "is", null)
      .lte("next_review_date", now)
      .order("next_review_date", { ascending: true });

    if (error) {
      console.error("Error fetching review questions:", error);
      return [];
    }

    return (data || []).map(q => ({
      id: q.id,
      category: q.category,
      question: q.question,
      createdAt: new Date(q.created_at).getTime(),
      options: q.options as string[],
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      tags: q.tags || undefined,
      notes: q.notes || undefined,
      difficulty: q.difficulty as DifficultyLevel | undefined,
      questionType: (q.question_type || "standard") as QuestionType,
      timesAnswered: q.times_answered || undefined,
      timesCorrect: q.times_correct || undefined,
      timesIncorrect: q.times_incorrect || undefined,
      lastAnsweredAt: q.last_answered_at ? new Date(q.last_answered_at).getTime() : undefined,
      averageTimeSpent: q.average_time_spent || undefined,
      isFavorite: q.is_favorite || false,
      imageUrl: q.image_url || undefined,
      spacedRepetition: q.ease_factor ? {
        easeFactor: q.ease_factor,
        interval: q.sr_interval || 0,
        repetitions: q.sr_repetitions || 0,
        nextReviewDate: q.next_review_date ? new Date(q.next_review_date).getTime() : Date.now(),
        lastReviewDate: q.last_review_date ? new Date(q.last_review_date).getTime() : undefined,
      } : undefined,
    }));
  },

  // Get all question stats for the current user
  async getUserQuestionStats(): Promise<Map<string, {
    timesAnswered: number;
    timesCorrect: number;
    timesIncorrect: number;
    lastAnsweredAt?: number;
    averageTimeSpent?: number;
    spacedRepetition?: SpacedRepetitionData;
  }>> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return new Map();

    const { data, error } = await supabase
      .from("user_question_stats")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching user question stats:", error);
      return new Map();
    }

    const statsMap = new Map<string, {
      timesAnswered: number;
      timesCorrect: number;
      timesIncorrect: number;
      lastAnsweredAt?: number;
      averageTimeSpent?: number;
      spacedRepetition?: SpacedRepetitionData;
    }>();

    (data || []).forEach(stat => {
      statsMap.set(stat.question_id, {
        timesAnswered: stat.times_answered || 0,
        timesCorrect: stat.times_correct || 0,
        timesIncorrect: stat.times_incorrect || 0,
        lastAnsweredAt: stat.last_answered_at ? new Date(stat.last_answered_at).getTime() : undefined,
        averageTimeSpent: stat.average_time_spent || undefined,
        spacedRepetition: stat.ease_factor ? {
          easeFactor: stat.ease_factor,
          interval: stat.sr_interval || 0,
          repetitions: stat.sr_repetitions || 0,
          nextReviewDate: stat.next_review_date ? new Date(stat.next_review_date).getTime() : Date.now(),
          lastReviewDate: stat.last_review_date ? new Date(stat.last_review_date).getTime() : undefined,
        } : undefined,
      });
    });

    return statsMap;
  },

  // Update question stats after answering
  async updateQuestionStats(
    questionId: string,
    isCorrect: boolean,
    timeSpent: number,
    spacedRepetition?: SpacedRepetitionData
  ): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Use the upsert function
    const { error } = await supabase.rpc("upsert_question_stats", {
      p_user_id: user.id,
      p_question_id: questionId,
      p_is_correct: isCorrect,
      p_time_spent: timeSpent,
      p_ease_factor: spacedRepetition?.easeFactor || null,
      p_sr_interval: spacedRepetition?.interval || null,
      p_sr_repetitions: spacedRepetition?.repetitions || null,
      p_next_review_date: spacedRepetition?.nextReviewDate
        ? new Date(spacedRepetition.nextReviewDate).toISOString()
        : null,
      p_last_review_date: spacedRepetition?.lastReviewDate
        ? new Date(spacedRepetition.lastReviewDate).toISOString()
        : null,
    });

    if (error) {
      console.error("Error updating question stats:", error);

      // Fallback: try direct upsert if function doesn't exist
      const { data: existing } = await supabase
        .from("user_question_stats")
        .select("*")
        .eq("user_id", user.id)
        .eq("question_id", questionId)
        .single();

      if (existing) {
        // Update existing
        const newTimesAnswered = (existing.times_answered || 0) + 1;
        const newTimesCorrect = (existing.times_correct || 0) + (isCorrect ? 1 : 0);
        const newTimesIncorrect = (existing.times_incorrect || 0) + (isCorrect ? 0 : 1);
        const newAvgTime = existing.times_answered > 0 && existing.average_time_spent > 0
          ? (existing.average_time_spent * existing.times_answered + timeSpent) / newTimesAnswered
          : timeSpent;

        await supabase
          .from("user_question_stats")
          .update({
            times_answered: newTimesAnswered,
            times_correct: newTimesCorrect,
            times_incorrect: newTimesIncorrect,
            last_answered_at: new Date().toISOString(),
            average_time_spent: newAvgTime,
            ...(spacedRepetition && {
              ease_factor: spacedRepetition.easeFactor,
              sr_interval: spacedRepetition.interval,
              sr_repetitions: spacedRepetition.repetitions,
              next_review_date: new Date(spacedRepetition.nextReviewDate).toISOString(),
              last_review_date: spacedRepetition.lastReviewDate
                ? new Date(spacedRepetition.lastReviewDate).toISOString()
                : null,
            }),
          })
          .eq("user_id", user.id)
          .eq("question_id", questionId);
      } else {
        // Insert new
        await supabase
          .from("user_question_stats")
          .insert({
            user_id: user.id,
            question_id: questionId,
            times_answered: 1,
            times_correct: isCorrect ? 1 : 0,
            times_incorrect: isCorrect ? 0 : 1,
            last_answered_at: new Date().toISOString(),
            average_time_spent: timeSpent,
            ...(spacedRepetition && {
              ease_factor: spacedRepetition.easeFactor,
              sr_interval: spacedRepetition.interval,
              sr_repetitions: spacedRepetition.repetitions,
              next_review_date: new Date(spacedRepetition.nextReviewDate).toISOString(),
              last_review_date: spacedRepetition.lastReviewDate
                ? new Date(spacedRepetition.lastReviewDate).toISOString()
                : null,
            }),
          });
      }
    }
  },

  // Get tag statistics
  async getTagStatistics(): Promise<Array<{
    tag: string;
    questionCount: number;
    totalAnswered: number;
    totalCorrect: number;
    averageScore: number;
  }>> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("tag_statistics")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching tag statistics:", error);
      return [];
    }

    return (data || []).map(t => ({
      tag: t.tag,
      questionCount: t.question_count || 0,
      totalAnswered: t.total_answered || 0,
      totalCorrect: t.total_correct || 0,
      averageScore: t.average_score || 0,
    }));
  },

  // Use database function for comprehensive statistics
  async getStatisticsOptimized(): Promise<Statistics & { tagStats?: Array<{ tag: string; questionCount: number; totalAnswered: number; totalCorrect: number; averageScore: number }> }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        totalQuestions: 0,
        totalSessions: 0,
        totalTimeSpent: 0,
        averageScore: 0,
        bestScore: 0,
        recentSessions: [],
        categoryStats: {},
        difficultyStats: {
          easy: { totalAnswered: 0, totalCorrect: 0, averageScore: 0 },
          medium: { totalAnswered: 0, totalCorrect: 0, averageScore: 0 },
          hard: { totalAnswered: 0, totalCorrect: 0, averageScore: 0 },
        },
        questionTypeStats: {
          "standard": { totalAnswered: 0, totalCorrect: 0, averageScore: 0, averageTime: 0 },
          "double-series": { totalAnswered: 0, totalCorrect: 0, averageScore: 0, averageTime: 0 },
          "conditions-minimales": { totalAnswered: 0, totalCorrect: 0, averageScore: 0, averageTime: 0 },
          "graphic-series": { totalAnswered: 0, totalCorrect: 0, averageScore: 0, averageTime: 0 },
        },
        tagStats: [],
      };
    }

    // Try to use the database function for optimized stats
    const { data, error } = await supabase.rpc("get_user_statistics", {
      p_user_id: user.id,
    });

    if (error || !data) {
      console.error("Error fetching optimized statistics:", error);
      // Fallback to regular getStatistics
      const stats = await this.getStatistics();
      return { ...stats, tagStats: [] };
    }

    // Get recent sessions separately (the function doesn't return them)
    const { data: sessions } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(10);

    const recentSessions: TrainingSession[] = (sessions || []).map(s => ({
      id: s.id,
      questions: [],
      currentIndex: 0,
      answers: [],
      startedAt: new Date(s.created_at).getTime(),
      completedAt: s.completed_at ? new Date(s.completed_at).getTime() : undefined,
      mode: s.mode as SessionMode,
      score: s.score,
      totalTime: s.total_time,
    }));

    return {
      totalQuestions: data.totalQuestions || 0,
      totalSessions: data.totalSessions || 0,
      totalTimeSpent: data.totalTimeSpent || 0,
      averageScore: data.averageScore || 0,
      bestScore: data.bestScore || 0,
      recentSessions,
      categoryStats: data.categoryStats || {},
      difficultyStats: data.difficultyStats || {
        easy: { totalAnswered: 0, totalCorrect: 0, averageScore: 0 },
        medium: { totalAnswered: 0, totalCorrect: 0, averageScore: 0 },
        hard: { totalAnswered: 0, totalCorrect: 0, averageScore: 0 },
      },
      questionTypeStats: data.questionTypeStats || {
        "standard": { totalAnswered: 0, totalCorrect: 0, averageScore: 0, averageTime: 0 },
        "double-series": { totalAnswered: 0, totalCorrect: 0, averageScore: 0, averageTime: 0 },
      },
      streak: data.streak ? {
        current: data.streak.current || 0,
        longest: data.streak.longest || 0,
        lastSessionDate: data.streak.lastSessionDate,
        totalDaysActive: data.streak.totalDaysActive || 0,
        weeklyActivity: data.streak.weeklyActivity || [false, false, false, false, false, false, false],
      } : undefined,
      tagStats: data.tagStats || [],
    };
  },
};
