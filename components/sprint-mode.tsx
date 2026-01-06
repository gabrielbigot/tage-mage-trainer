"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Question, QuestionResult } from "@/lib/types";
import { storage } from "@/lib/storage";
import { DoubleSeriesDisplay } from "@/components/double-series-display";
import {
  Zap,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Trophy,
  Timer,
  Target,
  Flame,
  Home,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SPRINT_QUESTIONS = 20;
const SPRINT_TIME_LIMIT = 10 * 60; // 10 minutes in seconds

interface SprintModeProps {
  onBack: () => void;
}

export function SprintMode({ onBack }: SprintModeProps) {
  const [phase, setPhase] = useState<"config" | "countdown" | "sprint" | "results">("config");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(SPRINT_TIME_LIMIT);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [sessionId, setSessionId] = useState<string>("");

  const questionStartTime = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentIndex];

  // Load questions
  const loadQuestions = async () => {
    setLoading(true);
    try {
      const allQuestions = await storage.getRandomQuestions(SPRINT_QUESTIONS);
      if (allQuestions.length < SPRINT_QUESTIONS) {
        alert(`Pas assez de questions disponibles. ${allQuestions.length} questions trouvées.`);
        onBack();
        return;
      }
      setQuestions(allQuestions);
      setAnswers(new Array(allQuestions.length).fill(null));
      setQuestionTimes(new Array(allQuestions.length).fill(0));

      const id = await storage.createSession(allQuestions, "sprint");
      setSessionId(id);
    } catch (error) {
      console.error("Error loading questions:", error);
      alert("Erreur lors du chargement des questions");
      onBack();
    }
    setLoading(false);
  };

  // Start countdown
  const startCountdown = () => {
    setPhase("countdown");
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(countdownInterval);
        setPhase("sprint");
        questionStartTime.current = Date.now();
      }
    }, 1000);
  };

  // Main timer effect
  useEffect(() => {
    if (phase === "sprint" && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up!
            finishSprint();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [phase]);

  // Handle answer selection
  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);

    const timeSpent = Math.round((Date.now() - questionStartTime.current) / 1000);
    const newTimes = [...questionTimes];
    newTimes[currentIndex] = timeSpent;
    setQuestionTimes(newTimes);

    const newAnswers = [...answers];
    newAnswers[currentIndex] = index;
    setAnswers(newAnswers);

    // Auto-advance after brief delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
        questionStartTime.current = Date.now();
      } else {
        finishSprint();
      }
    }, 300);
  };

  // Finish sprint
  const finishSprint = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const finalResults: QuestionResult[] = questions.map((q, i) => ({
      questionId: q.id,
      question: q,
      userAnswer: answers[i],
      isCorrect: answers[i] === q.correctAnswer,
      timeSpent: questionTimes[i],
    }));

    setResults(finalResults);

    const totalTime = SPRINT_TIME_LIMIT - timeRemaining;
    await storage.completeSession(sessionId, finalResults, totalTime);

    setPhase("results");
  }, [questions, answers, questionTimes, timeRemaining, sessionId]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate stats
  const getStats = () => {
    const correct = results.filter((r) => r.isCorrect).length;
    const totalTime = SPRINT_TIME_LIMIT - timeRemaining;
    const avgTimePerQuestion = totalTime / questions.length;
    const score = Math.round((correct / questions.length) * 100);

    return { correct, totalTime, avgTimePerQuestion, score };
  };

  // Render config phase
  if (phase === "config") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="h-8 w-8 text-yellow-500" />
              Mode Sprint
            </h1>
            <p className="text-muted-foreground mt-1">
              20 questions, 10 minutes. Rapidité et précision !
            </p>
          </div>
          <Button variant="outline" onClick={onBack}>
            <Home className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-yellow-500" />
              Règles du Sprint
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Timer className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="font-semibold">10 minutes</p>
                  <p className="text-xs text-muted-foreground">Temps total</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Zap className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="font-semibold">20 questions</p>
                  <p className="text-xs text-muted-foreground">Aléatoires</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/30 border border-white/5">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Objectif :</strong> Répondez au maximum de questions correctement
                avant la fin du temps. Chaque réponse vous fait passer automatiquement à la question suivante.
              </p>
            </div>

            <Button
              onClick={() => {
                loadQuestions().then(() => startCountdown());
              }}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Chargement...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Lancer le Sprint
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render countdown
  if (phase === "countdown") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <motion.div
          key={countdown}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          className="text-9xl font-bold text-yellow-500"
        >
          {countdown === 0 ? "GO!" : countdown}
        </motion.div>
      </div>
    );
  }

  // Render results
  if (phase === "results") {
    const stats = getStats();

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-yellow-500/10">
            <Trophy className="h-12 w-12 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold">Sprint Terminé !</h1>
          <p className="text-xl text-muted-foreground">
            {stats.score >= 80
              ? "Excellent travail ! 🔥"
              : stats.score >= 60
              ? "Bien joué ! 💪"
              : "Continue à t'entraîner ! 📚"}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: CheckCircle2,
              label: "Score",
              value: `${stats.score}%`,
              color: "text-green-500",
              bg: "bg-green-500/10",
            },
            {
              icon: Target,
              label: "Correctes",
              value: `${stats.correct}/${questions.length}`,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              icon: Clock,
              label: "Temps total",
              value: formatTime(stats.totalTime),
              color: "text-orange-500",
              bg: "bg-orange-500/10",
            },
            {
              icon: Zap,
              label: "Moy./question",
              value: `${Math.round(stats.avgTimePerQuestion)}s`,
              color: "text-yellow-500",
              bg: "bg-yellow-500/10",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
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

        {/* Results detail */}
        <Card className="border-white/5 bg-card/50">
          <CardHeader>
            <CardTitle>Détail des réponses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-2">
              {results.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    r.isCorrect
                      ? "bg-green-500/20 text-green-500"
                      : r.userAnswer === null
                      ? "bg-muted text-muted-foreground"
                      : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {i + 1}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <Home className="h-4 w-4 mr-2" />
            Accueil
          </Button>
          <Button
            onClick={() => {
              setPhase("config");
              setQuestions([]);
              setCurrentIndex(0);
              setSelectedAnswer(null);
              setAnswers([]);
              setTimeRemaining(SPRINT_TIME_LIMIT);
              setQuestionTimes([]);
              setResults([]);
            }}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            <Zap className="h-4 w-4 mr-2" />
            Nouveau Sprint
          </Button>
        </div>
      </div>
    );
  }

  // Render sprint
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Timer bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                timeRemaining <= 60
                  ? "bg-red-500/20 text-red-500"
                  : timeRemaining <= 180
                  ? "bg-orange-500/20 text-orange-500"
                  : "bg-yellow-500/20 text-yellow-500"
              }`}
            >
              <Timer className="h-4 w-4" />
              <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Question {currentIndex + 1}/{questions.length}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Correctes:</span>
            <span className="font-bold text-green-500">
              {answers.filter((a, i) => a === questions[i]?.correctAnswer).length}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-yellow-500"
            initial={{ width: "100%" }}
            animate={{ width: `${(timeRemaining / SPRINT_TIME_LIMIT) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-white/5 bg-card/50">
            <CardHeader>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span className="px-2 py-0.5 rounded bg-muted">{currentQuestion?.category}</span>
                {currentQuestion?.difficulty && (
                  <span
                    className={`px-2 py-0.5 rounded ${
                      currentQuestion.difficulty === "easy"
                        ? "bg-green-500/10 text-green-500"
                        : currentQuestion.difficulty === "hard"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {currentQuestion.difficulty === "easy"
                      ? "Facile"
                      : currentQuestion.difficulty === "hard"
                      ? "Difficile"
                      : "Moyen"}
                  </span>
                )}
              </div>
              <CardTitle className="text-xl leading-relaxed">{currentQuestion?.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQuestion?.questionType === "double-series" && currentQuestion.doubleSeriesData && (
                <div className="mb-6">
                  <DoubleSeriesDisplay data={currentQuestion.doubleSeriesData} />
                </div>
              )}

              {currentQuestion?.options.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null}
                  className={`w-full p-4 rounded-xl text-left transition-all border ${
                    selectedAnswer === index
                      ? index === currentQuestion.correctAnswer
                        ? "border-green-500 bg-green-500/10"
                        : "border-red-500 bg-red-500/10"
                      : "border-white/10 hover:border-yellow-500/50 hover:bg-yellow-500/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold ${
                        selectedAnswer === index
                          ? index === currentQuestion.correctAnswer
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                          : "bg-muted"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {selectedAnswer === index &&
                      (index === currentQuestion.correctAnswer ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ))}
                  </div>
                </motion.button>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
