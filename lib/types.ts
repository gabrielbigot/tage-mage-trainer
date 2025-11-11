export type DifficultyLevel = "easy" | "medium" | "hard";
export type SessionMode = "practice" | "exam" | "review" | "flashcards";

export interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  createdAt: number;
  // New fields for improvements
  difficulty?: DifficultyLevel;
  tags?: string[];
  notes?: string;
  isFavorite?: boolean;
  imageUrl?: string;
  // Statistics
  timesAnswered?: number;
  timesCorrect?: number;
  timesIncorrect?: number;
  lastAnsweredAt?: number;
  averageTimeSpent?: number; // in seconds
}

export interface QuestionResult {
  questionId: string;
  question: Question;
  userAnswer: number | null;
  isCorrect: boolean;
  timeSpent?: number; // in seconds
}

export interface TrainingSession {
  id: string;
  questions: Question[];
  currentIndex: number;
  answers: (number | null)[];
  startedAt: number;
  completedAt?: number;
  // New fields
  mode?: SessionMode;
  score?: number;
  totalTime?: number; // in seconds
  results?: QuestionResult[];
  categoryScores?: Record<string, { correct: number; total: number }>;
}

export interface Statistics {
  totalQuestions: number;
  totalSessions: number;
  totalTimeSpent: number; // in seconds
  averageScore: number;
  bestScore: number;
  recentSessions: TrainingSession[];
  categoryStats: Record<string, {
    totalAnswered: number;
    totalCorrect: number;
    averageScore: number;
  }>;
  difficultyStats: Record<DifficultyLevel, {
    totalAnswered: number;
    totalCorrect: number;
    averageScore: number;
  }>;
  streak?: {
    current: number;
    longest: number;
    lastSessionDate?: string;
  };
}
