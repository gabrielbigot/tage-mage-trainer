/**
 * Client-side storage adapter for Notion
 * Uses API routes to communicate with Notion (server-side only)
 */

import { Question, TrainingSession, QuestionResult, Statistics, DifficultyLevel, SessionMode } from "./types";

// Cache local pour les sessions en cours
const localSessions: Map<string, TrainingSession> = new Map();
const localStats = {
  sessions: [] as TrainingSession[],
  questionStats: new Map<string, { correct: number; incorrect: number; totalTime: number; count: number }>(),
};

// Charger les stats depuis localStorage au démarrage
if (typeof window !== "undefined") {
  const saved = localStorage.getItem("notion-stats");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      localStats.sessions = data.sessions || [];
      localStats.questionStats = new Map(data.questionStats || []);
    } catch (e) {
      console.error("Error loading stats from localStorage:", e);
    }
  }
}

// Sauvegarder les stats dans localStorage
function saveStats() {
  if (typeof window !== "undefined") {
    localStorage.setItem("notion-stats", JSON.stringify({
      sessions: localStats.sessions,
      questionStats: Array.from(localStats.questionStats.entries()),
    }));
  }
}

export const notionStorage = {
  // Questions
  async getQuestions(): Promise<Question[]> {
    try {
      const response = await fetch("/api/notion/questions");
      if (!response.ok) throw new Error("Failed to fetch questions");
      const data = await response.json();

      // Ajouter les stats locales
      const questions = data.questions.map((q: Question) => {
        const stats = localStats.questionStats.get(q.id);
        if (stats) {
          return {
            ...q,
            timesAnswered: stats.count,
            timesCorrect: stats.correct,
            timesIncorrect: stats.incorrect,
            averageTimeSpent: stats.count > 0 ? stats.totalTime / stats.count : undefined,
          };
        }
        return q;
      });

      return questions;
    } catch (error) {
      console.error("Error fetching questions:", error);
      return [];
    }
  },

  async addQuestion(question: Omit<Question, "id" | "createdAt">): Promise<Question | null> {
    try {
      const response = await fetch("/api/notion/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(question),
      });

      if (!response.ok) throw new Error("Failed to add question");
      const data = await response.json();
      return data.question;
    } catch (error) {
      console.error("Error adding question:", error);
      return null;
    }
  },

  async updateQuestion(id: string, updates: Partial<Question>): Promise<void> {
    try {
      const response = await fetch(`/api/notion/questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update question");
    } catch (error) {
      console.error("Error updating question:", error);
    }
  },

  async deleteQuestion(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/notion/questions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete question");
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  },

  async getQuestionsByCategory(category: string): Promise<Question[]> {
    try {
      const response = await fetch(`/api/notion/questions?category=${encodeURIComponent(category)}`);
      if (!response.ok) throw new Error("Failed to fetch questions");
      const data = await response.json();
      return data.questions;
    } catch (error) {
      console.error("Error fetching questions by category:", error);
      return [];
    }
  },

  async getRandomQuestions(count: number): Promise<Question[]> {
    const questions = await this.getQuestions();
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },

  async getQuestionsByDifficulty(difficulty: DifficultyLevel): Promise<Question[]> {
    try {
      const response = await fetch(`/api/notion/questions?difficulty=${difficulty}`);
      if (!response.ok) throw new Error("Failed to fetch questions");
      const data = await response.json();
      return data.questions;
    } catch (error) {
      console.error("Error fetching questions by difficulty:", error);
      return [];
    }
  },

  async getFavoriteQuestions(): Promise<Question[]> {
    try {
      const response = await fetch("/api/notion/questions?favorite=true");
      if (!response.ok) throw new Error("Failed to fetch questions");
      const data = await response.json();
      return data.questions;
    } catch (error) {
      console.error("Error fetching favorite questions:", error);
      return [];
    }
  },

  async getQuestionsByTags(tags: string[]): Promise<Question[]> {
    try {
      const response = await fetch(`/api/notion/questions?tags=${tags.join(",")}`);
      if (!response.ok) throw new Error("Failed to fetch questions");
      const data = await response.json();
      return data.questions;
    } catch (error) {
      console.error("Error fetching questions by tags:", error);
      return [];
    }
  },

  async toggleFavorite(id: string): Promise<void> {
    const questions = await this.getQuestions();
    const question = questions.find(q => q.id === id);
    if (!question) return;

    await this.updateQuestion(id, { isFavorite: !question.isFavorite });
  },

  async getIncorrectQuestions(minErrors: number = 1): Promise<Question[]> {
    const questions = await this.getQuestions();
    return questions
      .filter(q => (q.timesIncorrect || 0) >= minErrors)
      .sort((a, b) => (b.timesIncorrect || 0) - (a.timesIncorrect || 0));
  },

  // Image upload (non supporté par Notion API)
  async uploadImage(file: File): Promise<string | null> {
    console.warn("Image upload not implemented for Notion. Please upload images manually to Notion pages.");
    return null;
  },

  async deleteImage(imageUrl: string): Promise<void> {
    // Non applicable
  },

  // Sessions (stockées localement)
  async createSession(questions: Question[], mode: SessionMode = "practice"): Promise<string> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session: TrainingSession = {
      id: sessionId,
      questions,
      currentIndex: 0,
      answers: new Array(questions.length).fill(null),
      startedAt: Date.now(),
      mode,
    };

    localSessions.set(sessionId, session);
    return sessionId;
  },

  async completeSession(
    sessionId: string,
    results: QuestionResult[],
    totalTime: number
  ): Promise<void> {
    const session = localSessions.get(sessionId);
    if (!session) return;

    const correctAnswers = results.filter(r => r.isCorrect).length;
    const score = Math.round((correctAnswers / results.length) * 100);

    session.completedAt = Date.now();
    session.score = score;
    session.totalTime = totalTime;
    session.results = results;

    // Mettre à jour les stats locales
    for (const result of results) {
      const stats = localStats.questionStats.get(result.questionId) || {
        correct: 0,
        incorrect: 0,
        totalTime: 0,
        count: 0,
      };

      stats.count++;
      if (result.isCorrect) {
        stats.correct++;
      } else {
        stats.incorrect++;
      }
      if (result.timeSpent) {
        stats.totalTime += result.timeSpent;
      }

      localStats.questionStats.set(result.questionId, stats);
    }

    localStats.sessions.push(session);
    localSessions.delete(sessionId);

    // Sauvegarder dans localStorage
    saveStats();
  },

  async updateStreak(): Promise<void> {
    // Géré via localStorage
  },

  async getStreak(): Promise<{ current: number; longest: number; lastSessionDate?: string }> {
    if (typeof window === "undefined") {
      return { current: 0, longest: 0 };
    }

    const saved = localStorage.getItem("notion-streak");
    if (!saved) {
      return { current: 0, longest: 0 };
    }

    return JSON.parse(saved);
  },

  async getStatistics(): Promise<Statistics> {
    const questions = await this.getQuestions();
    const completedSessions = localStats.sessions.filter(s => s.completedAt);

    // Stats par catégorie
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

    // Stats par difficulté
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

    const totalTimeSpent = completedSessions.reduce((sum, s) => sum + (s.totalTime || 0), 0);
    const averageScore = completedSessions.length > 0
      ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length)
      : 0;
    const bestScore = completedSessions.length > 0
      ? Math.max(...completedSessions.map(s => s.score || 0))
      : 0;

    return {
      totalQuestions: questions.length,
      totalSessions: completedSessions.length,
      totalTimeSpent,
      averageScore,
      bestScore,
      recentSessions: completedSessions.slice(-10),
      categoryStats,
      difficultyStats,
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
            isFavorite: q.isFavorite,
          });
          imported++;
        } catch (error) {
          console.error("Error importing question:", error);
        }
      }

      return {
        success: true,
        message: `${imported} question(s) importée(s) dans Notion`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erreur lors de l'import : format JSON invalide",
      };
    }
  },
};
