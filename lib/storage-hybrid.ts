/**
 * Hybrid storage adapter
 * Uses Notion for questions and Supabase for statistics/sessions
 * Falls back to localStorage when not authenticated
 */

import { Question, TrainingSession, QuestionResult, Statistics, DifficultyLevel, SessionMode, StreakData } from "./types";
import { notionStorage } from "./notion-storage-client";
import { supabaseStorage } from "./supabase-storage";
import { createClient } from "@/lib/supabase/client";

// Check if user is authenticated with Supabase
async function isSupabaseAuthenticated(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

export const hybridStorage = {
  // ========================================
  // QUESTIONS - Delegated to Notion
  // ========================================

  async getQuestions(): Promise<Question[]> {
    // First try to get questions from Notion
    const notionQuestions = await notionStorage.getQuestions();

    // If user is authenticated with Supabase, merge with question stats from Supabase
    if (await isSupabaseAuthenticated()) {
      try {
        // Get per-question stats (times answered, SR data, etc.)
        const questionStatsMap = await supabaseStorage.getUserQuestionStats();

        // Merge stats into Notion questions
        return notionQuestions.map(q => {
          const stats = questionStatsMap.get(q.id);
          if (stats) {
            return {
              ...q,
              timesAnswered: stats.timesAnswered,
              timesCorrect: stats.timesCorrect,
              timesIncorrect: stats.timesIncorrect,
              lastAnsweredAt: stats.lastAnsweredAt,
              averageTimeSpent: stats.averageTimeSpent,
              spacedRepetition: stats.spacedRepetition || q.spacedRepetition,
            };
          }
          return q;
        });
      } catch (error) {
        console.error("Error merging Supabase question stats:", error);
      }
    }

    return notionQuestions;
  },

  async addQuestion(question: Omit<Question, "id" | "createdAt">): Promise<Question | null> {
    return notionStorage.addQuestion(question);
  },

  async updateQuestion(id: string, updates: Partial<Question>): Promise<void> {
    // Update in Notion for core question data (category, question text, options, etc.)
    const notionUpdates: Partial<Question> = { ...updates };
    delete notionUpdates.spacedRepetition;
    delete notionUpdates.timesAnswered;
    delete notionUpdates.timesCorrect;
    delete notionUpdates.timesIncorrect;
    delete notionUpdates.lastAnsweredAt;
    delete notionUpdates.averageTimeSpent;

    if (Object.keys(notionUpdates).length > 0) {
      await notionStorage.updateQuestion(id, notionUpdates);
    }

    // If we have SR data updates, save to user_question_stats in Supabase
    if (updates.spacedRepetition && await isSupabaseAuthenticated()) {
      // Use updateQuestionStats with a neutral answer (won't change times_answered/correct/incorrect)
      // Actually, for SR-only updates, we need a different approach
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const sr = updates.spacedRepetition;
        await supabase
          .from("user_question_stats")
          .upsert({
            user_id: user.id,
            question_id: id,
            ease_factor: sr.easeFactor,
            sr_interval: sr.interval,
            sr_repetitions: sr.repetitions,
            next_review_date: new Date(sr.nextReviewDate).toISOString(),
            last_review_date: sr.lastReviewDate
              ? new Date(sr.lastReviewDate).toISOString()
              : null,
          }, {
            onConflict: 'user_id,question_id',
          });
      }
    }
  },

  async deleteQuestion(id: string): Promise<void> {
    return notionStorage.deleteQuestion(id);
  },

  async getQuestionsByCategory(category: string): Promise<Question[]> {
    return notionStorage.getQuestionsByCategory(category);
  },

  async getRandomQuestions(count: number): Promise<Question[]> {
    return notionStorage.getRandomQuestions(count);
  },

  async getQuestionsByDifficulty(difficulty: DifficultyLevel): Promise<Question[]> {
    return notionStorage.getQuestionsByDifficulty(difficulty);
  },

  async getFavoriteQuestions(): Promise<Question[]> {
    return notionStorage.getFavoriteQuestions();
  },

  async getQuestionsByTags(tags: string[]): Promise<Question[]> {
    return notionStorage.getQuestionsByTags(tags);
  },

  async toggleFavorite(id: string): Promise<void> {
    return notionStorage.toggleFavorite(id);
  },

  async getIncorrectQuestions(minErrors: number = 1): Promise<Question[]> {
    // Get all questions with merged stats from Supabase
    const allQuestions = await this.getQuestions();

    // Filter to only those with errors
    return allQuestions
      .filter(q => (q.timesIncorrect || 0) >= minErrors)
      .sort((a, b) => (b.timesIncorrect || 0) - (a.timesIncorrect || 0));
  },

  // ========================================
  // SESSIONS & STATISTICS - Supabase first, localStorage fallback
  // ========================================

  async createSession(questions: Question[], mode: SessionMode = "practice"): Promise<string> {
    if (await isSupabaseAuthenticated()) {
      return supabaseStorage.createSession(questions, mode);
    }
    // Fallback to Notion storage (localStorage-based)
    return notionStorage.createSession(questions, mode);
  },

  async completeSession(sessionId: string, results: QuestionResult[], totalTime: number): Promise<void> {
    // Always try Supabase first if authenticated
    if (await isSupabaseAuthenticated()) {
      try {
        await supabaseStorage.completeSession(sessionId, results, totalTime);
        return;
      } catch (error) {
        console.error("Error completing session in Supabase:", error);
      }
    }

    // Fallback to Notion storage (localStorage-based)
    await notionStorage.completeSession(sessionId, results, totalTime);
  },

  async getStreak(): Promise<StreakData> {
    if (await isSupabaseAuthenticated()) {
      try {
        return await supabaseStorage.getStreak();
      } catch (error) {
        console.error("Error getting streak from Supabase:", error);
      }
    }
    return notionStorage.getStreak();
  },

  async getStatistics(): Promise<Statistics> {
    if (await isSupabaseAuthenticated()) {
      try {
        return await supabaseStorage.getStatistics();
      } catch (error) {
        console.error("Error getting statistics from Supabase:", error);
      }
    }
    return notionStorage.getStatistics();
  },

  async getAllSessions(limit: number = 20, offset: number = 0): Promise<{
    sessions: TrainingSession[];
    total: number;
    hasMore: boolean;
  }> {
    if (await isSupabaseAuthenticated()) {
      try {
        return await supabaseStorage.getAllSessions(limit, offset);
      } catch (error) {
        console.error("Error getting sessions from Supabase:", error);
      }
    }
    return { sessions: [], total: 0, hasMore: false };
  },

  async getSessionDetails(sessionId: string): Promise<{
    session: TrainingSession;
    results: Array<{
      questionId: string;
      userAnswer: number | null;
      isCorrect: boolean;
      timeSpent: number;
    }>;
  } | null> {
    if (await isSupabaseAuthenticated()) {
      try {
        return await supabaseStorage.getSessionDetails(sessionId);
      } catch (error) {
        console.error("Error getting session details from Supabase:", error);
      }
    }
    return null;
  },

  // ========================================
  // IMAGE HANDLING - Supabase Storage
  // ========================================

  async uploadImage(file: File): Promise<string | null> {
    if (await isSupabaseAuthenticated()) {
      return supabaseStorage.uploadImage(file);
    }
    // Fallback to Notion
    return notionStorage.uploadImage(file);
  },

  async deleteImage(imageUrl: string): Promise<void> {
    if (await isSupabaseAuthenticated()) {
      return supabaseStorage.deleteImage(imageUrl);
    }
    return notionStorage.deleteImage(imageUrl);
  },

  // ========================================
  // EXPORT/IMPORT
  // ========================================

  async exportData(): Promise<string> {
    return notionStorage.exportData();
  },

  async importData(jsonData: string): Promise<{ success: boolean; message: string }> {
    return notionStorage.importData(jsonData);
  },
};
