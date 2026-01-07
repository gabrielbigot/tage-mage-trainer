"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Question, QuestionResult, DailyChallenge as DailyChallengeType, StreakData } from "@/lib/types";
import { storage } from "@/lib/storage";
import { supabaseStorage } from "@/lib/supabase-storage";
import { createClient } from "@/lib/supabase/client";
import { DoubleSeriesDisplay } from "@/components/double-series-display";
import {
  Calendar,
  Flame,
  Trophy,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  Home,
  Star,
  Gift,
  ArrowRight,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DAILY_CHALLENGE_QUESTIONS = 10;
const DAILY_TARGET_SCORE = 70;

interface DailyChallengeProps {
  onBack: () => void;
}

// Helper to get today's date string
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

// Helper to get yesterday's date string
function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

// Helper to generate a deterministic seed from date
function getDateSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Seeded random function
function seededRandom(seed: number): () => number {
  return function () {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

export function DailyChallenge({ onBack }: DailyChallengeProps) {
  const [phase, setPhase] = useState<"loading" | "info" | "challenge" | "results" | "completed">("loading");
  const [challenge, setChallenge] = useState<DailyChallengeType | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [streak, setStreak] = useState<StreakData>({
    current: 0,
    longest: 0,
    totalDaysActive: 0,
    weeklyActivity: [false, false, false, false, false, false, false],
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState(0);

  const questionStartTime = useRef<number>(0);
  const currentQuestion = questions[currentIndex];

  // Load challenge data
  useEffect(() => {
    loadDailyChallenge();
  }, []);

  const loadDailyChallenge = async () => {
    try {
      // Check if user is authenticated for Supabase
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const useSupabase = !!user;

      // Load streak data
      const storedStreak = await loadStreak(useSupabase);
      setStreak(storedStreak);

      // Load or create today's challenge
      const todayStr = getTodayString();

      // Try Supabase first if authenticated
      let savedChallenge: DailyChallengeType | null = null;
      if (useSupabase) {
        savedChallenge = await supabaseStorage.getDailyChallenge(todayStr);
      }

      // Fallback to localStorage
      if (!savedChallenge) {
        const localChallenge = localStorage.getItem(`daily-challenge-${todayStr}`);
        if (localChallenge) {
          savedChallenge = JSON.parse(localChallenge) as DailyChallengeType;
        }
      }

      if (savedChallenge) {
        const parsed = savedChallenge;
        setChallenge(parsed);

        if (parsed.completed) {
          setPhase("completed");
        } else {
          // Load questions for unfinished challenge
          const allQuestions = await storage.getQuestions();
          const challengeQuestions = parsed.questions
            .map((id) => allQuestions.find((q) => q.id === id))
            .filter((q): q is Question => q !== undefined);

          if (challengeQuestions.length === parsed.questions.length) {
            setQuestions(challengeQuestions);
            setAnswers(new Array(challengeQuestions.length).fill(null));
            setQuestionTimes(new Array(challengeQuestions.length).fill(0));
          }
          setPhase("info");
        }
      } else {
        // Create new challenge
        const allQuestions = await storage.getQuestions();
        if (allQuestions.length < DAILY_CHALLENGE_QUESTIONS) {
          alert("Pas assez de questions pour le défi quotidien.");
          onBack();
          return;
        }

        // Use seeded random for consistent daily selection
        const seed = getDateSeed(todayStr);
        const random = seededRandom(seed);
        const shuffled = [...allQuestions].sort(() => random() - 0.5);
        const selectedQuestions = shuffled.slice(0, DAILY_CHALLENGE_QUESTIONS);

        const newChallenge: DailyChallengeType = {
          id: `challenge-${todayStr}`,
          date: todayStr,
          questions: selectedQuestions.map((q) => q.id),
          targetScore: DAILY_TARGET_SCORE,
          completed: false,
        };

        // Save to both localStorage (fallback) and Supabase (if authenticated)
        localStorage.setItem(`daily-challenge-${todayStr}`, JSON.stringify(newChallenge));
        if (useSupabase) {
          await supabaseStorage.saveDailyChallenge(newChallenge);
        }
        setChallenge(newChallenge);
        setQuestions(selectedQuestions);
        setAnswers(new Array(selectedQuestions.length).fill(null));
        setQuestionTimes(new Array(selectedQuestions.length).fill(0));
        setPhase("info");
      }
    } catch (error) {
      console.error("Error loading daily challenge:", error);
      onBack();
    }
  };

  const loadStreak = async (useSupabase: boolean): Promise<StreakData> => {
    const defaultStreak: StreakData = { current: 0, longest: 0, totalDaysActive: 0, weeklyActivity: Array(7).fill(false) };

    if (typeof window === "undefined") {
      return defaultStreak;
    }

    // Try Supabase first if authenticated
    if (useSupabase) {
      try {
        const supabaseStreak = await supabaseStorage.getStreak();
        if (supabaseStreak && (supabaseStreak.current > 0 || supabaseStreak.longest > 0)) {
          return supabaseStreak;
        }
      } catch (error) {
        console.error("Error loading streak from Supabase:", error);
      }
    }

    // Fallback to localStorage
    const saved = localStorage.getItem("daily-challenge-streak");
    if (!saved) {
      return defaultStreak;
    }

    try {
      const data = JSON.parse(saved) as StreakData;
      const today = getTodayString();
      const yesterday = getYesterdayString();

      // Check if streak is still valid
      if (data.lastSessionDate !== today && data.lastSessionDate !== yesterday) {
        // Streak broken
        return {
          ...data,
          current: 0,
          weeklyActivity: updateWeeklyActivity(data.weeklyActivity, false),
        };
      }

      return data;
    } catch {
      return defaultStreak;
    }
  };

  const updateWeeklyActivity = (current: boolean[], addToday: boolean): boolean[] => {
    const newActivity = [...current.slice(1), addToday];
    return newActivity;
  };

  const saveStreak = (newStreak: StreakData) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("daily-challenge-streak", JSON.stringify(newStreak));
    }
  };

  // Start challenge
  const startChallenge = () => {
    setSessionStartTime(Date.now());
    questionStartTime.current = Date.now();
    setPhase("challenge");
  };

  // Handle answer selection
  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(index);
    setShowAnswer(true);

    const timeSpent = Math.round((Date.now() - questionStartTime.current) / 1000);
    const newTimes = [...questionTimes];
    newTimes[currentIndex] = timeSpent;
    setQuestionTimes(newTimes);

    const newAnswers = [...answers];
    newAnswers[currentIndex] = index;
    setAnswers(newAnswers);
  };

  // Next question
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
      questionStartTime.current = Date.now();
    } else {
      finishChallenge();
    }
  };

  // Finish challenge
  const finishChallenge = useCallback(async () => {
    const finalResults: QuestionResult[] = questions.map((q, i) => ({
      questionId: q.id,
      question: q,
      userAnswer: answers[i],
      isCorrect: answers[i] === q.correctAnswer,
      timeSpent: questionTimes[i],
    }));

    setResults(finalResults);

    const correctCount = finalResults.filter((r) => r.isCorrect).length;
    const score = Math.round((correctCount / questions.length) * 100);
    const totalTime = Math.round((Date.now() - sessionStartTime) / 1000);

    // Check if user is authenticated for Supabase
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const useSupabase = !!user;

    // Update challenge
    const updatedChallenge: DailyChallengeType = {
      ...challenge!,
      completed: true,
      score,
      completedAt: Date.now(),
      timeSpent: totalTime,
    };

    setChallenge(updatedChallenge);

    // Save to localStorage (fallback) and Supabase (if authenticated)
    localStorage.setItem(`daily-challenge-${challenge!.date}`, JSON.stringify(updatedChallenge));
    if (useSupabase) {
      await supabaseStorage.saveDailyChallenge(updatedChallenge);
    }

    // Update streak
    const today = getTodayString();
    const newStreak: StreakData = {
      current: streak.lastSessionDate === getYesterdayString() ? streak.current + 1 : 1,
      longest: Math.max(
        streak.longest,
        streak.lastSessionDate === getYesterdayString() ? streak.current + 1 : 1
      ),
      lastSessionDate: today,
      totalDaysActive: streak.totalDaysActive + 1,
      weeklyActivity: updateWeeklyActivity(streak.weeklyActivity, true),
    };

    setStreak(newStreak);
    saveStreak(newStreak);

    // Save to main statistics (this also updates streak in Supabase via the trigger)
    const sessionId = await storage.createSession(questions, "daily-challenge");
    await storage.completeSession(sessionId, finalResults, totalTime);

    setPhase("results");
  }, [questions, answers, questionTimes, challenge, streak, sessionStartTime]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Render loading
  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render completed state
  if (phase === "completed" && challenge) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              Défi Quotidien
            </h1>
          </div>
          <Button variant="outline" onClick={onBack}>
            <Home className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold">Défi complété !</h2>
              <p className="text-muted-foreground">
                Vous avez terminé le défi du jour avec un score de{" "}
                <span className="font-bold text-foreground">{challenge.score}%</span>
              </p>

              {/* Streak display */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10">
                <Flame className="h-6 w-6 text-orange-500" />
                <span className="text-xl font-bold text-orange-500">{streak.current} jours</span>
              </div>

              <p className="text-sm text-muted-foreground">Revenez demain pour continuer votre série !</p>
            </div>
          </CardContent>
        </Card>

        {/* Weekly activity */}
        <Card className="border-white/5 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg">Activité de la semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between gap-2">
              {["L", "M", "M", "J", "V", "S", "D"].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      streak.weeklyActivity[i]
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {streak.weeklyActivity[i] ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="text-sm">{day}</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render info phase
  if (phase === "info") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              Défi Quotidien
            </h1>
            <p className="text-muted-foreground mt-1">
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <Button variant="outline" onClick={onBack}>
            <Home className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        {/* Streak card */}
        <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-orange-500/10">
                  <Flame className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-orange-500">{streak.current} jours</p>
                  <p className="text-sm text-muted-foreground">Série en cours</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Record</p>
                <p className="text-xl font-bold">{streak.longest} jours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Challenge info */}
        <Card className="border-white/5 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Défi du jour
            </CardTitle>
            <CardDescription>Complétez le défi pour maintenir votre série !</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{DAILY_CHALLENGE_QUESTIONS} questions</p>
                  <p className="text-xs text-muted-foreground">À compléter</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Trophy className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold">{DAILY_TARGET_SCORE}%</p>
                  <p className="text-xs text-muted-foreground">Objectif</p>
                </div>
              </div>
            </div>

            {/* Weekly activity */}
            <div className="p-4 rounded-lg bg-muted/30 border border-white/5">
              <p className="text-sm font-medium mb-3">Activité de la semaine</p>
              <div className="flex justify-between gap-2">
                {["L", "M", "M", "J", "V", "S", "D"].map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                        streak.weeklyActivity[i]
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {streak.weeklyActivity[i] ? "✓" : day}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={startChallenge} className="w-full" size="lg">
              <Star className="h-4 w-4 mr-2" />
              Commencer le défi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render results
  if (phase === "results" && challenge) {
    const correctCount = results.filter((r) => r.isCorrect).length;
    const score = challenge.score || 0;
    const passed = score >= DAILY_TARGET_SCORE;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div
            className={`inline-flex items-center justify-center p-4 rounded-full ${
              passed ? "bg-green-500/10" : "bg-orange-500/10"
            }`}
          >
            {passed ? (
              <Trophy className="h-12 w-12 text-green-500" />
            ) : (
              <Target className="h-12 w-12 text-orange-500" />
            )}
          </div>
          <h1 className="text-4xl font-bold">{passed ? "Défi réussi !" : "Défi terminé"}</h1>
          <p className="text-xl text-muted-foreground">
            {passed
              ? `Bravo ! Vous avez atteint l'objectif de ${DAILY_TARGET_SCORE}%`
              : `Objectif : ${DAILY_TARGET_SCORE}% - Vous avez obtenu ${score}%`}
          </p>
        </motion.div>

        {/* Streak celebration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-4">
                <Flame className="h-10 w-10 text-orange-500 animate-pulse" />
                <div className="text-center">
                  <p className="text-4xl font-bold text-orange-500">{streak.current} jours</p>
                  <p className="text-sm text-muted-foreground">
                    {streak.current > streak.longest - 1 ? "Nouveau record ! 🎉" : "Série en cours"}
                  </p>
                </div>
                <Flame className="h-10 w-10 text-orange-500 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: CheckCircle2,
              label: "Score",
              value: `${score}%`,
              color: score >= 80 ? "text-green-500" : score >= 60 ? "text-yellow-500" : "text-red-500",
              bg: score >= 80 ? "bg-green-500/10" : score >= 60 ? "bg-yellow-500/10" : "bg-red-500/10",
            },
            {
              icon: Target,
              label: "Correctes",
              value: `${correctCount}/${questions.length}`,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              icon: Clock,
              label: "Temps",
              value: formatTime(challenge.timeSpent || 0),
              color: "text-orange-500",
              bg: "bg-orange-500/10",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <Card className="border-white/5 bg-card/50">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className={`p-3 rounded-xl ${stat.bg} mb-2`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Button onClick={onBack} className="w-full" size="lg">
          <Home className="h-4 w-4 mr-2" />
          Retour à l&apos;accueil
        </Button>
      </div>
    );
  }

  // Render challenge
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Progress header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-bold text-orange-500">{streak.current}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Question {currentIndex + 1}/{questions.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Objectif:</span>
            <span className="font-bold text-primary">{DAILY_TARGET_SCORE}%</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
        >
          <Card className="border-white/5 bg-card/50">
            <CardHeader>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span className="px-2 py-0.5 rounded bg-muted">{currentQuestion?.category}</span>
              </div>
              <CardTitle className="text-xl leading-relaxed">{currentQuestion?.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQuestion?.questionType === "double-series" && currentQuestion.doubleSeriesData && (
                <div className="mb-6">
                  <DoubleSeriesDisplay data={currentQuestion.doubleSeriesData} />
                </div>
              )}

              {currentQuestion?.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === currentQuestion.correctAnswer;
                const showResult = showAnswer;

                return (
                  <motion.button
                    key={index}
                    whileHover={!showAnswer ? { scale: 1.01 } : {}}
                    whileTap={!showAnswer ? { scale: 0.99 } : {}}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={selectedAnswer !== null}
                    className={`w-full p-4 rounded-xl text-left transition-all border ${
                      showResult
                        ? isCorrect
                          ? "border-green-500 bg-green-500/10"
                          : isSelected
                          ? "border-red-500 bg-red-500/10"
                          : "border-white/10 opacity-50"
                        : isSelected
                        ? "border-primary bg-primary/10"
                        : "border-white/10 hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold ${
                          showResult
                            ? isCorrect
                              ? "bg-green-500 text-white"
                              : isSelected
                              ? "bg-red-500 text-white"
                              : "bg-muted"
                            : isSelected
                            ? "bg-primary text-white"
                            : "bg-muted"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {showResult &&
                        (isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          isSelected && <XCircle className="h-5 w-5 text-red-500" />
                        ))}
                    </div>
                  </motion.button>
                );
              })}

              {/* Explanation */}
              {showAnswer && currentQuestion?.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-muted/30 border border-white/5 mt-4"
                >
                  <p className="text-sm font-medium mb-1">Explication</p>
                  <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                </motion.div>
              )}

              {/* Next button */}
              {showAnswer && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <Button onClick={handleNext} className="w-full mt-4" size="lg">
                    {currentIndex < questions.length - 1 ? (
                      <>
                        Question suivante
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Voir les résultats
                        <Trophy className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
