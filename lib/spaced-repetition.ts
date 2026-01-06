/**
 * Spaced Repetition Algorithm (SM-2)
 * Based on the SuperMemo 2 algorithm by Piotr Wozniak
 *
 * Quality ratings:
 * 0 - Complete blackout, no recall
 * 1 - Incorrect, but remembered upon seeing answer
 * 2 - Incorrect, but easy to recall after hint
 * 3 - Correct with significant difficulty
 * 4 - Correct after hesitation
 * 5 - Perfect, instant recall
 */

import { SpacedRepetitionData, Question } from "./types";

// Default initial values
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: number;
}

/**
 * Calculate the next review date using SM-2 algorithm
 * @param quality - Quality of recall (0-5)
 * @param currentData - Current spaced repetition data (optional for new questions)
 * @returns Updated spaced repetition data
 */
export function calculateSM2(
  quality: number,
  currentData?: SpacedRepetitionData
): SM2Result {
  // Clamp quality to valid range
  quality = Math.max(0, Math.min(5, Math.round(quality)));

  // Initialize or use existing data
  let easeFactor = currentData?.easeFactor ?? DEFAULT_EASE_FACTOR;
  let interval = currentData?.interval ?? 0;
  let repetitions = currentData?.repetitions ?? 0;

  // Calculate new ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);

  // Update interval based on quality
  if (quality < 3) {
    // Failed recall - reset repetitions
    repetitions = 0;
    interval = 1;
  } else {
    // Successful recall
    repetitions += 1;

    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  // Calculate next review date
  const nextReviewDate = Date.now() + (interval * 24 * 60 * 60 * 1000);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
  };
}

/**
 * Convert answer correctness to SM-2 quality rating
 * @param isCorrect - Whether the answer was correct
 * @param timeSpent - Time spent on question (seconds)
 * @param averageTime - Average time for this question (seconds)
 * @returns Quality rating (0-5)
 */
export function getQualityFromAnswer(
  isCorrect: boolean,
  timeSpent?: number,
  averageTime?: number
): number {
  if (!isCorrect) {
    return 1; // Incorrect but seen - will remember next time
  }

  // Correct answer - rate based on time
  if (!timeSpent || !averageTime) {
    return 4; // Default for correct without time data
  }

  const timeRatio = timeSpent / averageTime;

  if (timeRatio <= 0.5) {
    return 5; // Very fast - perfect recall
  } else if (timeRatio <= 1.0) {
    return 4; // Normal speed - good recall
  } else if (timeRatio <= 1.5) {
    return 3; // Slow - some difficulty
  } else {
    return 3; // Very slow but still correct
  }
}

/**
 * Get questions due for review based on spaced repetition
 * @param questions - All questions
 * @param maxQuestions - Maximum number of questions to return
 * @returns Questions sorted by urgency (most overdue first)
 */
export function getQuestionsForReview(
  questions: Question[],
  maxQuestions: number = 20
): Question[] {
  const now = Date.now();

  // Filter and sort questions
  const dueQuestions = questions
    .filter(q => {
      // Questions without SR data are new - include them
      if (!q.spacedRepetition) {
        return true;
      }
      // Include questions that are due or overdue
      return q.spacedRepetition.nextReviewDate <= now;
    })
    .sort((a, b) => {
      // New questions (no SR data) have lower priority than overdue ones
      const aDate = a.spacedRepetition?.nextReviewDate ?? now;
      const bDate = b.spacedRepetition?.nextReviewDate ?? now;

      // More overdue = higher priority (earlier date = more overdue)
      return aDate - bDate;
    });

  return dueQuestions.slice(0, maxQuestions);
}

/**
 * Get new questions that haven't been reviewed yet
 * @param questions - All questions
 * @param maxQuestions - Maximum number to return
 * @returns Questions without spaced repetition data
 */
export function getNewQuestions(
  questions: Question[],
  maxQuestions: number = 10
): Question[] {
  return questions
    .filter(q => !q.spacedRepetition)
    .slice(0, maxQuestions);
}

/**
 * Calculate mastery level based on spaced repetition data
 * @param srData - Spaced repetition data
 * @returns Mastery level (0-100)
 */
export function getMasteryLevel(srData?: SpacedRepetitionData): number {
  if (!srData) return 0;

  // Base mastery on repetitions and ease factor
  const repScore = Math.min(srData.repetitions * 20, 60); // Max 60 from reps
  const easeScore = ((srData.easeFactor - MIN_EASE_FACTOR) / (DEFAULT_EASE_FACTOR - MIN_EASE_FACTOR)) * 40; // Max 40 from ease

  return Math.min(100, Math.round(repScore + easeScore));
}

/**
 * Get review statistics for dashboard
 * @param questions - All questions
 * @returns Review statistics
 */
export function getReviewStats(questions: Question[]): {
  dueToday: number;
  newQuestions: number;
  mastered: number;
  learning: number;
  averageMastery: number;
} {
  const now = Date.now();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  let dueToday = 0;
  let newQuestions = 0;
  let mastered = 0;
  let learning = 0;
  let totalMastery = 0;

  questions.forEach(q => {
    if (!q.spacedRepetition) {
      newQuestions++;
      return;
    }

    const mastery = getMasteryLevel(q.spacedRepetition);
    totalMastery += mastery;

    if (mastery >= 80) {
      mastered++;
    } else {
      learning++;
    }

    if (q.spacedRepetition.nextReviewDate <= endOfDay.getTime()) {
      dueToday++;
    }
  });

  const questionsWithSR = questions.length - newQuestions;

  return {
    dueToday,
    newQuestions,
    mastered,
    learning,
    averageMastery: questionsWithSR > 0 ? Math.round(totalMastery / questionsWithSR) : 0,
  };
}
