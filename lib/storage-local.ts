import { Question, TrainingSession, QuestionResult, Statistics, DifficultyLevel, SessionMode, QuestionType } from "./types";

const QUESTIONS_KEY = "tage-mage-questions";
const SESSIONS_KEY = "tage-mage-sessions";

export const storage = {
  // Questions
  getQuestions(): Question[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(QUESTIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveQuestions(questions: Question[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
  },

  addQuestion(question: Omit<Question, "id" | "createdAt">): Question {
    const newQuestion: Question = {
      ...question,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    const questions = this.getQuestions();
    questions.push(newQuestion);
    this.saveQuestions(questions);
    return newQuestion;
  },

  updateQuestion(id: string, updates: Partial<Question>): void {
    const questions = this.getQuestions();
    const index = questions.findIndex((q) => q.id === id);
    if (index !== -1) {
      questions[index] = { ...questions[index], ...updates };
      this.saveQuestions(questions);
    }
  },

  deleteQuestion(id: string): void {
    const questions = this.getQuestions();
    const filtered = questions.filter((q) => q.id !== id);
    this.saveQuestions(filtered);
  },

  getQuestionsByCategory(category: string): Question[] {
    return this.getQuestions().filter((q) => q.category === category);
  },

  getRandomQuestions(count: number): Question[] {
    const questions = this.getQuestions();
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },

  // Sessions
  getSessions(): TrainingSession[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveSessions(sessions: TrainingSession[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  },

  createSession(questions: Question[]): TrainingSession {
    const session: TrainingSession = {
      id: crypto.randomUUID(),
      questions,
      currentIndex: 0,
      answers: new Array(questions.length).fill(null),
      startedAt: Date.now(),
    };
    const sessions = this.getSessions();
    sessions.push(session);
    this.saveSessions(sessions);
    return session;
  },

  updateSession(id: string, updates: Partial<TrainingSession>): void {
    const sessions = this.getSessions();
    const index = sessions.findIndex((s) => s.id === id);
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...updates };
      this.saveSessions(sessions);
    }
  },

  deleteSession(id: string): void {
    const sessions = this.getSessions();
    const filtered = sessions.filter((s) => s.id !== id);
    this.saveSessions(filtered);
  },

  // Complete a session and update statistics
  completeSession(sessionId: string, results: QuestionResult[], totalTime: number): void {
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex((s) => s.id === sessionId);

    if (sessionIndex !== -1) {
      const session = sessions[sessionIndex];
      const correctAnswers = results.filter(r => r.isCorrect).length;
      const score = Math.round((correctAnswers / results.length) * 100);

      // Calculate category scores
      const categoryScores: Record<string, { correct: number; total: number }> = {};
      results.forEach(r => {
        const cat = r.question.category;
        if (!categoryScores[cat]) {
          categoryScores[cat] = { correct: 0, total: 0 };
        }
        categoryScores[cat].total++;
        if (r.isCorrect) categoryScores[cat].correct++;
      });

      // Update session
      sessions[sessionIndex] = {
        ...session,
        completedAt: Date.now(),
        score,
        totalTime,
        results,
        categoryScores,
      };

      this.saveSessions(sessions);

      // Update question statistics
      results.forEach(result => {
        this.updateQuestionStats(result);
      });

      // Update streak
      this.updateStreak();
    }
  },

  // Update question statistics
  updateQuestionStats(result: QuestionResult): void {
    const questions = this.getQuestions();
    const questionIndex = questions.findIndex((q) => q.id === result.questionId);

    if (questionIndex !== -1) {
      const question = questions[questionIndex];
      questions[questionIndex] = {
        ...question,
        timesAnswered: (question.timesAnswered || 0) + 1,
        timesCorrect: (question.timesCorrect || 0) + (result.isCorrect ? 1 : 0),
        timesIncorrect: (question.timesIncorrect || 0) + (result.isCorrect ? 0 : 1),
        lastAnsweredAt: Date.now(),
        averageTimeSpent: result.timeSpent
          ? ((question.averageTimeSpent || 0) * (question.timesAnswered || 0) + result.timeSpent) / ((question.timesAnswered || 0) + 1)
          : question.averageTimeSpent,
      };
      this.saveQuestions(questions);
    }
  },

  // Get statistics
  getStatistics(): Statistics {
    const questions = this.getQuestions();
    const sessions = this.getSessions().filter(s => s.completedAt);

    // Category stats
    const categoryStats: Record<string, { totalAnswered: number; totalCorrect: number; averageScore: number }> = {};
    questions.forEach(q => {
      const cat = q.category;
      if (!categoryStats[cat]) {
        categoryStats[cat] = { totalAnswered: 0, totalCorrect: 0, averageScore: 0 };
      }
      categoryStats[cat].totalAnswered += q.timesAnswered || 0;
      categoryStats[cat].totalCorrect += q.timesCorrect || 0;
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

    const totalTimeSpent = sessions.reduce((sum, s) => sum + (s.totalTime || 0), 0);
    const averageScore = sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length)
      : 0;
    const bestScore = sessions.length > 0
      ? Math.max(...sessions.map(s => s.score || 0))
      : 0;

    // Stats par type de question
    const questionTypeStats: Record<string, { totalAnswered: number; totalCorrect: number; averageScore: number; averageTime: number }> = {
      "standard": { totalAnswered: 0, totalCorrect: 0, averageScore: 0, averageTime: 0 },
      "double-series": { totalAnswered: 0, totalCorrect: 0, averageScore: 0, averageTime: 0 },
      "conditions-minimales": { totalAnswered: 0, totalCorrect: 0, averageScore: 0, averageTime: 0 },
    };

    const typeTimes: Record<string, number> = { "standard": 0, "double-series": 0, "conditions-minimales": 0 };
    questions.forEach(q => {
      const type = q.questionType || "standard";
      if (!questionTypeStats[type]) {
        questionTypeStats[type] = { totalAnswered: 0, totalCorrect: 0, averageScore: 0, averageTime: 0 };
        typeTimes[type] = 0;
      }
      questionTypeStats[type].totalAnswered += q.timesAnswered || 0;
      questionTypeStats[type].totalCorrect += q.timesCorrect || 0;
      typeTimes[type] += (q.averageTimeSpent || 0) * (q.timesAnswered || 0);
    });

    Object.keys(questionTypeStats).forEach(type => {
      questionTypeStats[type].averageScore = questionTypeStats[type].totalAnswered > 0
        ? Math.round((questionTypeStats[type].totalCorrect / questionTypeStats[type].totalAnswered) * 100)
        : 0;
      questionTypeStats[type].averageTime = questionTypeStats[type].totalAnswered > 0
        ? Math.round(typeTimes[type] / questionTypeStats[type].totalAnswered)
        : 0;
    });

    return {
      totalQuestions: questions.length,
      totalSessions: sessions.length,
      totalTimeSpent,
      averageScore,
      bestScore,
      recentSessions: sessions.slice(-10).reverse(),
      categoryStats,
      difficultyStats,
      questionTypeStats: questionTypeStats as Record<QuestionType, { totalAnswered: number; totalCorrect: number; averageScore: number; averageTime: number }>,
      streak: this.getStreak(),
    };
  },

  // Update streak
  updateStreak(): void {
    const STREAK_KEY = "tage-mage-streak";
    const today = new Date().toDateString();

    if (typeof window === "undefined") return;

    const streakData = localStorage.getItem(STREAK_KEY);
    const streak = streakData ? JSON.parse(streakData) : { current: 0, longest: 0, lastSessionDate: null };

    if (streak.lastSessionDate !== today) {
      const lastDate = streak.lastSessionDate ? new Date(streak.lastSessionDate) : null;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastDate && lastDate.toDateString() === yesterday.toDateString()) {
        // Continue streak
        streak.current++;
      } else if (lastDate && lastDate.toDateString() !== today) {
        // Reset streak
        streak.current = 1;
      } else if (!lastDate) {
        // First session
        streak.current = 1;
      }

      streak.longest = Math.max(streak.longest, streak.current);
      streak.lastSessionDate = today;

      localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
    }
  },

  // Get streak
  getStreak(): { current: number; longest: number; lastSessionDate?: string; totalDaysActive: number; weeklyActivity: boolean[] } {
    const STREAK_KEY = "tage-mage-streak";

    if (typeof window === "undefined") return { current: 0, longest: 0, totalDaysActive: 0, weeklyActivity: [false, false, false, false, false, false, false] };

    const streakData = localStorage.getItem(STREAK_KEY);
    if (!streakData) return { current: 0, longest: 0, totalDaysActive: 0, weeklyActivity: [false, false, false, false, false, false, false] };

    const streak = JSON.parse(streakData);
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if streak is broken
    if (streak.lastSessionDate) {
      const lastDate = new Date(streak.lastSessionDate).toDateString();
      if (lastDate !== today && lastDate !== yesterday.toDateString()) {
        streak.current = 0;
      }
    }

    return {
      current: streak.current || 0,
      longest: streak.longest || 0,
      lastSessionDate: streak.lastSessionDate,
      totalDaysActive: streak.totalDaysActive || 0,
      weeklyActivity: streak.weeklyActivity || [false, false, false, false, false, false, false],
    };
  },

  // Get questions that were answered incorrectly
  getIncorrectQuestions(minErrors: number = 1): Question[] {
    const questions = this.getQuestions();
    return questions
      .filter(q => (q.timesIncorrect || 0) >= minErrors)
      .sort((a, b) => (b.timesIncorrect || 0) - (a.timesIncorrect || 0));
  },

  // Get questions by difficulty
  getQuestionsByDifficulty(difficulty: DifficultyLevel): Question[] {
    return this.getQuestions().filter(q => q.difficulty === difficulty);
  },

  // Get favorite questions
  getFavoriteQuestions(): Question[] {
    return this.getQuestions().filter(q => q.isFavorite);
  },

  // Get questions by tags
  getQuestionsByTags(tags: string[]): Question[] {
    return this.getQuestions().filter(q =>
      q.tags && q.tags.some(tag => tags.includes(tag))
    );
  },

  // Toggle favorite
  toggleFavorite(id: string): void {
    const questions = this.getQuestions();
    const index = questions.findIndex((q) => q.id === id);
    if (index !== -1) {
      questions[index].isFavorite = !questions[index].isFavorite;
      this.saveQuestions(questions);
    }
  },

  // Export data
  exportData(): string {
    return JSON.stringify({
      questions: this.getQuestions(),
      sessions: this.getSessions(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  },

  // Import data
  importData(jsonData: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonData);

      if (!data.questions || !Array.isArray(data.questions)) {
        return { success: false, message: "Format invalide : 'questions' manquant ou incorrect" };
      }

      // Merge questions (avoid duplicates)
      const existingQuestions = this.getQuestions();
      const existingIds = new Set(existingQuestions.map(q => q.id));

      const newQuestions = data.questions.filter((q: Question) => !existingIds.has(q.id));
      const mergedQuestions = [...existingQuestions, ...newQuestions];

      this.saveQuestions(mergedQuestions);

      // Optionally import sessions
      if (data.sessions && Array.isArray(data.sessions)) {
        const existingSessions = this.getSessions();
        const existingSessionIds = new Set(existingSessions.map(s => s.id));
        const newSessions = data.sessions.filter((s: TrainingSession) => !existingSessionIds.has(s.id));
        const mergedSessions = [...existingSessions, ...newSessions];
        this.saveSessions(mergedSessions);
      }

      return {
        success: true,
        message: `${newQuestions.length} nouvelle(s) question(s) importée(s)`
      };
    } catch (error) {
      return {
        success: false,
        message: "Erreur lors de l'import : format JSON invalide"
      };
    }
  },

  // Clear all data
  clearAllData(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(QUESTIONS_KEY);
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem("tage-mage-streak");
  },
};
