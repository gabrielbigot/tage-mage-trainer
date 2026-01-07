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

    // If user is authenticated with Supabase, merge with SR data from Supabase
    if (await isSupabaseAuthenticated()) {
      try {
        const supabaseQuestions = await supabaseStorage.getQuestions();
        const srDataMap = new Map(
          supabaseQuestions
            .filter(q => q.spacedRepetition)
            .map(q => [q.id, q.spacedRepetition])
        );

        // Merge SR data into Notion questions
        return notionQuestions.map(q => ({
          ...q,
          spacedRepetition: srDataMap.get(q.id) || q.spacedRepetition,
        }));
      } catch (error) {
        console.error("Error merging Supabase data:", error);
      }
    }

    return notionQuestions;
  },

  async addQuestion(question: Omit<Question, "id" | "createdAt">): Promise<Question | null> {
    return notionStorage.addQuestion(question);
  },

  async updateQuestion(id: string, updates: Partial<Question>): Promise<void> {
    // Update in Notion for core question data
    await notionStorage.updateQuestion(id, updates);

    // If we have SR data updates, also save to Supabase
    if (updates.spacedRepetition && await isSupabaseAuthenticated()) {
      await supabaseStorage.updateQuestion(id, { spacedRepetition: updates.spacedRepetition });
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

  async getIncorrectQuestions(minErrors?: number): Promise<Question[]> {
    return notionStorage.getIncorrectQuestions(minErrors);
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
