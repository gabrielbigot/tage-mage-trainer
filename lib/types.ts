export type DifficultyLevel = "easy" | "medium" | "hard";
export type SessionMode = "practice" | "exam" | "review" | "flashcards" | "sprint" | "daily-challenge" | "spaced-review";
export type QuestionType = "standard" | "double-series";

// Spaced Repetition (SM-2 Algorithm) data
export interface SpacedRepetitionData {
  easeFactor: number;      // Ease factor (starts at 2.5)
  interval: number;        // Days until next review
  repetitions: number;     // Number of successful reviews
  nextReviewDate: number;  // Timestamp of next review
  lastReviewDate?: number; // Timestamp of last review
}

// Daily Challenge data
export interface DailyChallenge {
  id: string;
  date: string;            // YYYY-MM-DD format
  questions: string[];     // Question IDs
  targetScore: number;     // Target score percentage
  completed: boolean;
  score?: number;
  completedAt?: number;
  timeSpent?: number;
}

// Streak data (enhanced)
export interface StreakData {
  current: number;
  longest: number;
  lastSessionDate?: string;
  totalDaysActive: number;
  weeklyActivity: boolean[];  // Last 7 days activity
}

export interface DoubleSeriesData {
  horizontalSeries: string[];  // ex: ["A", "B", "C", "D", "?"]
  verticalSeries: string[];    // ex: ["5", "8", "11", "14", "?"]
  horizontalLabel?: string;    // ex: "Série alphabétique"
  verticalLabel?: string;      // ex: "Série numérique"
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
  // Double series support
  questionType?: QuestionType;
  doubleSeriesData?: DoubleSeriesData;
  // Statistics
  timesAnswered?: number;
  timesCorrect?: number;
  timesIncorrect?: number;
  lastAnsweredAt?: number;
  averageTimeSpent?: number; // in seconds
  // Spaced Repetition
  spacedRepetition?: SpacedRepetitionData;
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
  totalQuestions?: number; // Total questions in session
  correctAnswers?: number; // Correct answers count
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
  questionTypeStats: Record<QuestionType, {
    totalAnswered: number;
    totalCorrect: number;
    averageScore: number;
    averageTime: number;
  }>;
  streak?: StreakData;
  // Tag stats
  tagStats?: Array<{
    tag: string;
    totalAnswered: number;
    totalCorrect: number;
    averageScore: number;
  }>;
  // Sprint mode stats
  sprintStats?: {
    totalSprints: number;
    bestTime: number;
    averageTime: number;
    averageScore: number;
  };
  // Daily challenge stats
  dailyChallengeStats?: {
    totalCompleted: number;
    currentStreak: number;
    longestStreak: number;
    averageScore: number;
  };
}
