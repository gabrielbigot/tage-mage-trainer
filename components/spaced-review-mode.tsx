"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Question, QuestionResult } from "@/lib/types";
import { storage } from "@/lib/storage";
import { DoubleSeriesDisplay } from "@/components/double-series-display";
import {
  calculateSM2,
  getQualityFromAnswer,
  getQuestionsForReview,
  getNewQuestions,
  getReviewStats,
  getMasteryLevel,
} from "@/lib/spaced-repetition";
import {
  Brain,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Home,
  Sparkles,
  BookOpen,
  Target,
  BarChart3,
  RefreshCw,
  GraduationCap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SpacedReviewModeProps {
  onBack: () => void;
}

export function SpacedReviewMode({ onBack }: SpacedReviewModeProps) {
  const [phase, setPhase] = useState<"loading" | "info" | "review" | "results">("loading");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState(0);
  const [stats, setStats] = useState({
    dueToday: 0,
    newQuestions: 0,
    mastered: 0,
    learning: 0,
    averageMastery: 0,
  });

  const questionStartTime = useRef<number>(0);
  const currentQuestion = reviewQuestions[currentIndex];

  // Load questions and stats
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const questions = await storage.getQuestions();
      setAllQuestions(questions);

      const reviewStats = getReviewStats(questions);
      setStats(reviewStats);

      // Get questions due for review
      const dueQuestions = getQuestionsForReview(questions, 20);
      setReviewQuestions(dueQuestions);
      setQuestionTimes(new Array(dueQuestions.length).fill(0));

      setPhase("info");
    } catch (error) {
      console.error("Error loading data:", error);
      onBack();
    }
  };

  // Start review session
  const startReview = (includeNew: boolean = true) => {
    let questions = getQuestionsForReview(allQuestions, 15);

    // Add new questions if requested
    if (includeNew) {
      const newQ = getNewQuestions(allQuestions, 5);
      questions = [...questions, ...newQ].slice(0, 20);
    }

    if (questions.length === 0) {
      alert("Aucune question à réviser pour le moment !");
      return;
    }

    setReviewQuestions(questions);
    setQuestionTimes(new Array(questions.length).fill(0));
    setSessionStartTime(Date.now());
    questionStartTime.current = Date.now();
    setPhase("review");
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
  };

  // Handle quality rating and next question
  const handleNext = async () => {
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const timeSpent = questionTimes[currentIndex];

    // Calculate quality and update spaced repetition data
    const quality = getQualityFromAnswer(isCorrect, timeSpent, currentQuestion.averageTimeSpent);
    const newSRData = calculateSM2(quality, currentQuestion.spacedRepetition);

    // Save result
    const result: QuestionResult = {
      questionId: currentQuestion.id,
      question: currentQuestion,
      userAnswer: selectedAnswer,
      isCorrect,
      timeSpent,
    };

    setResults((prev) => [...prev, result]);

    // Update question with new SR data (store locally for now)
    const updatedQuestion = {
      ...currentQuestion,
      spacedRepetition: {
        ...newSRData,
        lastReviewDate: Date.now(),
      },
    };

    // Save SR data to localStorage
    saveSRData(currentQuestion.id, updatedQuestion.spacedRepetition);

    // Move to next question or finish
    if (currentIndex < reviewQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
      questionStartTime.current = Date.now();
    } else {
      finishReview();
    }
  };

  // Save SR data to localStorage
  const saveSRData = (questionId: string, srData: any) => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("spaced-repetition-data");
    const data = saved ? JSON.parse(saved) : {};
    data[questionId] = srData;
    localStorage.setItem("spaced-repetition-data", JSON.stringify(data));
  };

  // Finish review session
  const finishReview = useCallback(async () => {
    const totalTime = Math.round((Date.now() - sessionStartTime) / 1000);

    // Create and complete session
    const sessionId = await storage.createSession(reviewQuestions, "review");
    await storage.completeSession(sessionId, results, totalTime);

    setPhase("results");
  }, [reviewQuestions, results, sessionStartTime]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get mastery color
  const getMasteryColor = (level: number) => {
    if (level >= 80) return "text-green-500";
    if (level >= 50) return "text-yellow-500";
    if (level >= 20) return "text-orange-500";
    return "text-red-500";
  };

  // Render loading
  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
              <Brain className="h-8 w-8 text-purple-500" />
              Répétition Espacée
            </h1>
            <p className="text-muted-foreground mt-1">
              Algorithme SM-2 pour une mémorisation optimale
            </p>
          </div>
          <Button variant="outline" onClick={onBack}>
            <Home className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: Clock,
              label: "À réviser",
              value: stats.dueToday,
              color: "text-orange-500",
              bg: "bg-orange-500/10",
            },
            {
              icon: Sparkles,
              label: "Nouvelles",
              value: stats.newQuestions,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              icon: GraduationCap,
              label: "Maîtrisées",
              value: stats.mastered,
              color: "text-green-500",
              bg: "bg-green-500/10",
            },
            {
              icon: BookOpen,
              label: "En cours",
              value: stats.learning,
              color: "text-purple-500",
              bg: "bg-purple-500/10",
            },
          ].map((stat, i) => (
            <Card key={i} className="border-white/5 bg-card/50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className={`p-3 rounded-xl ${stat.bg} mb-2`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mastery progress */}
        <Card className="border-white/5 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Niveau de maîtrise global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Progression</span>
                <span className={`font-bold ${getMasteryColor(stats.averageMastery)}`}>
                  {stats.averageMastery}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.averageMastery}%` }}
                  transition={{ duration: 1 }}
                  className={`h-full rounded-full ${
                    stats.averageMastery >= 80
                      ? "bg-green-500"
                      : stats.averageMastery >= 50
                      ? "bg-yellow-500"
                      : stats.averageMastery >= 20
                      ? "bg-orange-500"
                      : "bg-red-500"
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardHeader>
            <CardTitle>Commencer une session</CardTitle>
            <CardDescription>Choisissez votre type de révision</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => startReview(true)}
              className="w-full bg-purple-500 hover:bg-purple-600"
              size="lg"
              disabled={stats.dueToday === 0 && stats.newQuestions === 0}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Révision complète ({Math.min(stats.dueToday + stats.newQuestions, 20)} questions)
            </Button>

            <Button
              onClick={() => startReview(false)}
              variant="outline"
              className="w-full"
              size="lg"
              disabled={stats.dueToday === 0}
            >
              <Clock className="h-4 w-4 mr-2" />
              Uniquement les révisions dues ({stats.dueToday})
            </Button>

            {stats.dueToday === 0 && stats.newQuestions === 0 && (
              <p className="text-center text-sm text-muted-foreground py-2">
                Aucune révision nécessaire pour le moment. Revenez plus tard !
              </p>
            )}
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="border-white/5 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg">Comment ça marche ?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">1.</strong> L'algorithme SM-2 calcule automatiquement quand vous devez réviser chaque question.
              </p>
              <p>
                <strong className="text-foreground">2.</strong> Plus vous répondez correctement et rapidement, plus l'intervalle avant la prochaine révision augmente.
              </p>
              <p>
                <strong className="text-foreground">3.</strong> Les questions difficiles sont présentées plus fréquemment jusqu'à ce qu'elles soient maîtrisées.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render results
  if (phase === "results") {
    const correctCount = results.filter((r) => r.isCorrect).length;
    const score = Math.round((correctCount / results.length) * 100);
    const totalTime = Math.round((Date.now() - sessionStartTime) / 1000);

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-purple-500/10">
            <Brain className="h-12 w-12 text-purple-500" />
          </div>
          <h1 className="text-4xl font-bold">Session terminée !</h1>
          <p className="text-xl text-muted-foreground">
            Les intervalles de révision ont été mis à jour
          </p>
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
              value: `${correctCount}/${results.length}`,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              icon: Clock,
              label: "Temps",
              value: formatTime(totalTime),
              color: "text-orange-500",
              bg: "bg-orange-500/10",
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
            <div className="space-y-2">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    r.isCorrect ? "bg-green-500/10" : "bg-red-500/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {r.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm truncate max-w-md">{r.question.question}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{r.timeSpent}s</span>
                </div>
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
              setPhase("info");
              setCurrentIndex(0);
              setSelectedAnswer(null);
              setShowAnswer(false);
              setResults([]);
              loadData();
            }}
            className="flex-1 bg-purple-500 hover:bg-purple-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Nouvelle session
          </Button>
        </div>
      </div>
    );
  }

  // Render review
  const mastery = getMasteryLevel(currentQuestion?.spacedRepetition);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Progress header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10">
              <Brain className="h-4 w-4 text-purple-500" />
              <span className="font-bold text-purple-500">SM-2</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Question {currentIndex + 1}/{reviewQuestions.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Maîtrise:</span>
            <span className={`font-bold ${getMasteryColor(mastery)}`}>{mastery}%</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / reviewQuestions.length) * 100}%` }}
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
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-muted">{currentQuestion?.category}</span>
                  {!currentQuestion?.spacedRepetition && (
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">Nouvelle</span>
                  )}
                </div>
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
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5"
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
                            ? "bg-purple-500 text-white"
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
                  <Button onClick={handleNext} className="w-full mt-4 bg-purple-500 hover:bg-purple-600" size="lg">
                    {currentIndex < reviewQuestions.length - 1 ? (
                      <>
                        Question suivante
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Terminer la session
                        <CheckCircle2 className="h-4 w-4 ml-2" />
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
