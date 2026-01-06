import { createClient } from "@/lib/supabase/client";
import { Question, TrainingSession, QuestionResult, Statistics, DifficultyLevel, SessionMode } from "./types";

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
      ...q,
      createdAt: new Date(q.created_at).getTime(),
      options: q.options as string[],
      correctAnswer: q.correct_answer,
      tags: q.tags || undefined,
      difficulty: q.difficulty as DifficultyLevel | undefined,
      timesAnswered: q.times_answered || undefined,
      timesCorrect: q.times_correct || undefined,
      timesIncorrect: q.times_incorrect || undefined,
      lastAnsweredAt: q.last_answered_at ? new Date(q.last_answered_at).getTime() : undefined,
      averageTimeSpent: q.average_time_spent || undefined,
      isFavorite: q.is_favorite || false,
      imageUrl: q.image_url || undefined,
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
      tags: data.tags || undefined,
      notes: data.notes || undefined,
      isFavorite: data.is_favorite || false,
      imageUrl: data.image_url || undefined,
    };
  },

  async updateQuestion(id: string, updates: Partial<Question>): Promise<void> {
    const supabase = createClient();

    const dbUpdates: any = {};
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.question) dbUpdates.question = updates.question;
    if (updates.options) dbUpdates.options = updates.options;
    if (updates.correctAnswer !== undefined) dbUpdates.correct_answer = updates.correctAnswer;
    if (updates.explanation !== undefined) dbUpdates.explanation = updates.explanation;
    if (updates.difficulty) dbUpdates.difficulty = updates.difficulty;
    if (updates.tags) dbUpdates.tags = updates.tags;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.timesAnswered !== undefined) dbUpdates.times_answered = updates.timesAnswered;
    if (updates.timesCorrect !== undefined) dbUpdates.times_correct = updates.timesCorrect;
    if (updates.timesIncorrect !== undefined) dbUpdates.times_incorrect = updates.timesIncorrect;
    if (updates.lastAnsweredAt) dbUpdates.last_answered_at = new Date(updates.lastAnsweredAt).toISOString();
    if (updates.averageTimeSpent !== undefined) dbUpdates.average_time_spent = updates.averageTimeSpent;

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

    const correctAnswers = results.filter(r => r.isCorrect).length;
    const score = Math.round((correctAnswers / results.length) * 100);

    // Update session
    await supabase
      .from("training_sessions")
      .update({
        score,
        total_time: totalTime,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    // Insert question results
    const questionResults = results.map(r => ({
      session_id: sessionId,
      question_id: r.questionId,
      user_answer: r.userAnswer,
      is_correct: r.isCorrect,
      time_spent: r.timeSpent || 0,
    }));

    await supabase
      .from("question_results")
      .insert(questionResults);

    // Update question statistics
    for (const result of results) {
      const { data: question } = await supabase
        .from("questions")
        .select("times_answered, times_correct, times_incorrect, average_time_spent")
        .eq("id", result.questionId)
        .single();

      if (question) {
        const newTimesAnswered = (question.times_answered || 0) + 1;
        const newTimesCorrect = (question.times_correct || 0) + (result.isCorrect ? 1 : 0);
        const newTimesIncorrect = (question.times_incorrect || 0) + (result.isCorrect ? 0 : 1);

        let newAverageTime = question.average_time_spent || 0;
        if (result.timeSpent) {
          newAverageTime = ((question.average_time_spent || 0) * (question.times_answered || 0) + result.timeSpent) / newTimesAnswered;
        }

        await supabase
          .from("questions")
          .update({
            times_answered: newTimesAnswered,
            times_correct: newTimesCorrect,
            times_incorrect: newTimesIncorrect,
            last_answered_at: new Date().toISOString(),
            average_time_spent: newAverageTime,
          })
          .eq("id", result.questionId);
      }
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
        },
      };
    }

    // Get completed sessions
    const { data: sessions } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false });

    const completedSessions = sessions || [];

    // Get questions with stats
    const questions = await this.getQuestions();

    // Category stats
    const categoryStats: Record<string, { totalAnswered: number; totalCorrect: number; averageScore: number }> = {};
    questions.forEach(q => {
      if (!categoryStats[q.category]) {
        categoryStats[q.category] = { totalAnswered: 0, totalCorrect: 0, averageScore: 0 };
      }
      categoryStats[q.category].totalAnswered += q.timesAnswered || 0;
      categoryStats[q.category].totalCorrect += q.timesCorrect || 0;
    });

    Object.keys(categoryStats).forEach(cat => {
      categoryStats[cat].averageScore = categoryStats[cat].totalAnswered > 0
        ? Math.round((categoryStats[cat].totalCorrect / categoryStats[cat].totalAnswered) * 100)
        : 0;
    });

    // Difficulty stats
    const difficultyStats: Record<DifficultyLevel, { totalAnswered: number; totalCorrect: number; averageScore: number }> = {
      easy: { totalAnswered: 0, totalCorrect: 0, averageScore: 0 },
      medium: { totalAnswered: 0, totalCorrect: 0, averageScore: 0 },
      hard: { totalAnswered: 0, totalCorrect: 0, averageScore: 0 },
    };

    questions.forEach(q => {
      const diff = q.difficulty || "medium";
      difficultyStats[diff].totalAnswered += q.timesAnswered || 0;
      difficultyStats[diff].totalCorrect += q.timesCorrect || 0;
    });

    Object.keys(difficultyStats).forEach(diff => {
      const d = diff as DifficultyLevel;
      difficultyStats[d].averageScore = difficultyStats[d].totalAnswered > 0
        ? Math.round((difficultyStats[d].totalCorrect / difficultyStats[d].totalAnswered) * 100)
        : 0;
    });

    const totalTimeSpent = completedSessions.reduce((sum, s) => sum + (s.total_time || 0), 0);
    const averageScore = completedSessions.length > 0
      ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length)
      : 0;
    const bestScore = completedSessions.length > 0
      ? Math.max(...completedSessions.map(s => s.score || 0))
      : 0;

    const recentSessions: TrainingSession[] = completedSessions.slice(0, 10).map(s => ({
      id: s.id,
      questions: [], // We don't need full questions for stats
      currentIndex: 0,
      answers: [],
      startedAt: new Date(s.created_at).getTime(),
      completedAt: s.completed_at ? new Date(s.completed_at).getTime() : undefined,
      mode: s.mode as SessionMode,
      score: s.score,
      totalTime: s.total_time,
    }));

    // Stats par type de question
    const questionTypeStats: Record<string, { totalAnswered: number; totalCorrect: number; averageScore: number; averageTime: number }> = {
      "standard": { totalAnswered: 0, totalCorrect: 0, averageScore: 0, averageTime: 0 },
      "double-series": { totalAnswered: 0, totalCorrect: 0, averageScore: 0, averageTime: 0 },
    };

    let standardTime = 0, doubleSeriesTime = 0;
    questions.forEach(q => {
      const type = q.questionType || "standard";
      questionTypeStats[type].totalAnswered += q.timesAnswered || 0;
      questionTypeStats[type].totalCorrect += q.timesCorrect || 0;
      if (type === "standard") {
        standardTime += (q.averageTimeSpent || 0) * (q.timesAnswered || 0);
      } else {
        doubleSeriesTime += (q.averageTimeSpent || 0) * (q.timesAnswered || 0);
      }
    });

    Object.keys(questionTypeStats).forEach(type => {
      questionTypeStats[type].averageScore = questionTypeStats[type].totalAnswered > 0
        ? Math.round((questionTypeStats[type].totalCorrect / questionTypeStats[type].totalAnswered) * 100)
        : 0;
    });
    questionTypeStats["standard"].averageTime = questionTypeStats["standard"].totalAnswered > 0
      ? Math.round(standardTime / questionTypeStats["standard"].totalAnswered)
      : 0;
    questionTypeStats["double-series"].averageTime = questionTypeStats["double-series"].totalAnswered > 0
      ? Math.round(doubleSeriesTime / questionTypeStats["double-series"].totalAnswered)
      : 0;

    return {
      totalQuestions: questions.length,
      totalSessions: completedSessions.length,
      totalTimeSpent,
      averageScore,
      bestScore,
      recentSessions,
      categoryStats,
      difficultyStats,
      questionTypeStats: questionTypeStats as Record<"standard" | "double-series", { totalAnswered: number; totalCorrect: number; averageScore: number; averageTime: number }>,
      streak: await this.getStreak(),
    };
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
};
