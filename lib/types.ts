export type DifficultyLevel = "easy" | "medium" | "hard";
export type SessionMode = "practice" | "exam" | "review" | "flashcards";
export type QuestionType = "standard" | "double-series";

// Structure for double alphanumeric series (cross format)
export interface DoubleSeriesData {
  top: string;      // Top position (e.g., "B4")
  bottom: string;   // Bottom position (e.g., "D16")
  left: string;     // Left position (e.g., "A1")
  right: string;    // Right position (e.g., "C9")
  center: string;   // Center position (e.g., "B5" or "?")
  missingPosition: "top" | "bottom" | "left" | "right" | "center"; // Which position to find
  horizontalLogic?: string; // Optional: explanation of horizontal logic
  verticalLogic?: string;   // Optional: explanation of vertical logic
}

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
  // Question type and specific data
  questionType?: QuestionType;
  doubleSeriesData?: DoubleSeriesData; // Only for double-series questions
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
