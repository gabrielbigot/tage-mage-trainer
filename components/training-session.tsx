"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Question, QuestionResult, SessionMode } from "@/lib/types";
import { storage } from "@/lib/storage";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, BookOpen } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DoubleSeriesDisplay } from "@/components/double-series-display";

interface TrainingSessionProps {
  onExit: () => void;
  mode?: SessionMode;
  customQuestions?: Question[];
  timePerQuestion?: number; // in seconds, 0 = no limit
}

export function TrainingSession({ onExit, mode = "practice", customQuestions, timePerQuestion = 0 }: TrainingSessionProps) {
  const [sessionId, setSessionId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(timePerQuestion);
  const sessionStartTime = useRef<number>(0);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initSession = async () => {
      const allQuestions = await storage.getQuestions();
      if (allQuestions.length === 0) {
        alert("Vous devez d'abord ajouter des questions !");
        onExit();
        return;
      }

      let sessionQuestions: Question[];
      if (customQuestions && customQuestions.length > 0) {
        sessionQuestions = customQuestions;
      } else {
        sessionQuestions = await storage.getRandomQuestions(Math.min(10, allQuestions.length));
      }

      const sessionId = await storage.createSession(sessionQuestions);
      setSessionId(sessionId);
      setQuestions(sessionQuestions);
      setAnswers(new Array(sessionQuestions.length).fill(null));
      setQuestionTimes(new Array(sessionQuestions.length).fill(0));

      sessionStartTime.current = Date.now();
      setQuestionStartTime(Date.now());
    };

    initSession();
  }, [onExit, customQuestions]);

  // Timer effect
  useEffect(() => {
    if (timePerQuestion > 0 && !showAnswer && !isComplete) {
      setTimeRemaining(timePerQuestion);

      timerInterval.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up - auto advance
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerInterval.current) {
          clearInterval(timerInterval.current);
        }
      };
    }
  }, [currentIndex, showAnswer, isComplete, timePerQuestion]);

  const handleTimeUp = () => {
    // Stop timer
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    // Save current answer (even if null)
    saveQuestionTime();
    const newAnswers = [...answers];
    newAnswers[currentIndex] = selectedAnswer;
    setAnswers(newAnswers);

    // Auto advance to next question or complete
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(answers[currentIndex + 1]);
      setShowAnswer(false);
      setQuestionStartTime(Date.now());
    } else {
      completeSession();
    }
  };

  const saveQuestionTime = () => {
    if (questionStartTime > 0) {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      const newTimes = [...questionTimes];
      newTimes[currentIndex] = timeSpent;
      setQuestionTimes(newTimes);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showAnswer) {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleValidate = () => {
    if (selectedAnswer === null) {
      alert("Veuillez sélectionner une réponse");
      return;
    }

    // Stop timer when validating in exam mode
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    saveQuestionTime();
    const newAnswers = [...answers];
    newAnswers[currentIndex] = selectedAnswer;
    setAnswers(newAnswers);

    // In exam mode, auto-advance instead of showing answer
    if (timePerQuestion > 0) {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
        setShowAnswer(false);
        setQuestionStartTime(Date.now());
      } else {
        completeSession();
      }
    } else {
      setShowAnswer(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(answers[currentIndex + 1]);
      setShowAnswer(timePerQuestion === 0 && answers[currentIndex + 1] !== null);
      setQuestionStartTime(Date.now());
    } else {
      completeSession();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      saveQuestionTime();
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(answers[currentIndex - 1]);
      setShowAnswer(answers[currentIndex - 1] !== null);
      setQuestionStartTime(Date.now());
    }
  };

  const completeSession = async () => {
    const totalTime = Math.floor((Date.now() - sessionStartTime.current) / 1000);

    const results: QuestionResult[] = questions.map((q, idx) => ({
      questionId: q.id,
      question: q,
      userAnswer: answers[idx],
      isCorrect: answers[idx] !== null && answers[idx] === q.correctAnswer,
      timeSpent: questionTimes[idx] || 0,
    }));

    await storage.completeSession(sessionId, results, totalTime);
    setIsComplete(true);
  };

  const calculateScore = (): number => {
    return answers.reduce((score: number, answer, index) => {
      return score + (answer !== null && answer === questions[index].correctAnswer ? 1 : 0);
    }, 0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (questions.length === 0) {
    return null;
  }

  if (isComplete) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);
    const totalTime = Math.floor((Date.now() - sessionStartTime.current) / 1000);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-3xl">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-700">
                Session terminée !
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="text-center space-y-4 py-8 bg-muted/30 rounded-2xl border border-white/5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-8xl font-bold text-primary drop-shadow-lg"
              >
                {percentage}%
              </motion.div>
              <p className="text-2xl font-medium text-muted-foreground">
                {score} / {questions.length} bonnes réponses
              </p>
              <div className="flex items-center justify-center gap-2 text-muted-foreground bg-background/50 w-fit mx-auto px-4 py-2 rounded-full border">
                <Clock className="h-4 w-4" />
                <span>Temps total : {formatTime(totalTime)}</span>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const userAnswer = answers[idx];
                const isCorrect = userAnswer === q.correctAnswer;

                return (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={q.id}
                  >
                    <Card className={cn(
                      "transition-all duration-300 hover:shadow-lg border-l-4",
                      isCorrect ? "border-l-green-500" : "border-l-red-500"
                    )}>
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className={cn(
                            "text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1",
                            isCorrect
                              ? "bg-green-500/10 text-green-600 dark:text-green-400"
                              : "bg-red-500/10 text-red-600 dark:text-red-400"
                          )}>
                            {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                          </span>
                          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                            {q.category}
                          </span>
                          {questionTimes[idx] > 0 && (
                            <span className="text-xs bg-muted px-3 py-1 rounded-full flex items-center gap-1 font-mono">
                              <Clock className="h-3 w-3" />
                              {formatTime(questionTimes[idx])}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-lg leading-relaxed">{q.question}</p>
                        {q.questionType === "double-series" && q.doubleSeriesData && (
                          <DoubleSeriesDisplay data={q.doubleSeriesData} />
                        )}
                        {q.imageUrl && (
                          <div className="my-4 rounded-xl overflow-hidden border bg-muted/50">
                            <img
                              src={q.imageUrl}
                              alt="Question"
                              className="w-full max-h-64 object-contain"
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={cn(
                                "text-sm px-4 py-3 rounded-lg flex items-center gap-3 transition-colors",
                                optIdx === q.correctAnswer
                                  ? "bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20"
                                  : optIdx === userAnswer
                                    ? "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20"
                                    : "bg-muted/50"
                              )}
                            >
                              {optIdx === q.correctAnswer && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                              {optIdx === userAnswer && optIdx !== q.correctAnswer && <span className="text-red-500 font-bold">✗</span>}
                              {opt}
                            </div>
                          ))}
                        </div>
                        {q.explanation && (
                          <div className="bg-blue-500/5 p-4 rounded-lg border border-blue-500/10 mt-4">
                            <p className="text-sm text-muted-foreground italic">
                              <span className="font-semibold text-primary not-italic block mb-1">Explication :</span>
                              {q.explanation}
                            </p>
                          </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <Link href={`/correction/${q.id}`} target="_blank">
                            <Button variant="ghost" size="sm" className="w-full hover:bg-primary/5">
                              <BookOpen className="h-4 w-4 mr-2" />
                              Voir la correction détaillée
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex gap-4 pt-6">
              <Button onClick={onExit} variant="outline" size="lg" className="flex-1">
                Retour à l&apos;accueil
              </Button>
              <Button
                onClick={() => window.location.reload()}
                size="lg"
                className="flex-1 shadow-lg shadow-primary/20"
              >
                Nouvelle session
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <CardTitle className="text-2xl">
                    Question {currentIndex + 1} <span className="text-muted-foreground text-lg font-normal">/ {questions.length}</span>
                  </CardTitle>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {currentQuestion.category}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {timePerQuestion > 0 && (
                    <div className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold transition-colors shadow-inner",
                      timeRemaining <= 10
                        ? "bg-red-500/10 text-red-600 animate-pulse"
                        : timeRemaining <= 30
                          ? "bg-yellow-500/10 text-yellow-600"
                          : "bg-green-500/10 text-green-600"
                    )}>
                      <Clock className="h-5 w-5" />
                      <span>
                        {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-primary h-full rounded-full"
                  initial={{ width: `${(currentIndex / questions.length) * 100}%` }}
                  animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="space-y-6">
                <p className="text-xl font-medium leading-relaxed">{currentQuestion.question}</p>

                {currentQuestion.questionType === "double-series" && currentQuestion.doubleSeriesData && (
                  <DoubleSeriesDisplay data={currentQuestion.doubleSeriesData} />
                )}

                {currentQuestion.imageUrl && (
                  <div className="rounded-xl overflow-hidden border bg-muted/30 shadow-inner">
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Question"
                      className="w-full max-h-96 object-contain"
                    />
                  </div>
                )}

                <div className="grid gap-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === currentQuestion.correctAnswer;
                    const showCorrect = showAnswer && isCorrect;
                    const showIncorrect = showAnswer && isSelected && !isCorrect;

                    return (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={showAnswer}
                        className={cn(
                          "w-full text-left px-6 py-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 group relative overflow-hidden",
                          showCorrect
                            ? "border-green-500 bg-green-500/5"
                            : showIncorrect
                              ? "border-red-500 bg-red-500/5"
                              : isSelected
                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-colors shrink-0",
                          showCorrect
                            ? "border-green-500 bg-green-500 text-white"
                            : showIncorrect
                              ? "border-red-500 bg-red-500 text-white"
                              : isSelected
                                ? "border-primary bg-primary text-white"
                                : "border-muted-foreground/30 text-muted-foreground group-hover:border-primary/50 group-hover:text-primary"
                        )}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="font-medium text-lg">{option}</span>

                        {(showCorrect || showIncorrect) && (
                          <div className="ml-auto">
                            {showCorrect ? (
                              <CheckCircle2 className="h-6 w-6 text-green-500" />
                            ) : (
                              <span className="text-red-500 font-bold text-xl">✗</span>
                            )}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {showAnswer && currentQuestion.explanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-blue-500/5 p-6 rounded-xl border border-blue-500/10"
                    >
                      <p className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">Explication</p>
                      <p className="text-muted-foreground leading-relaxed">{currentQuestion.explanation}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-4 pt-4 border-t border-border/50">
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="hover:bg-muted/50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Précédent
                </Button>

                <div className="flex-1" />

                {!showAnswer ? (
                  <Button
                    onClick={handleValidate}
                    size="lg"
                    className="px-8 shadow-lg shadow-primary/20"
                  >
                    Valider
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    size="lg"
                    className="px-8 shadow-lg shadow-primary/20"
                  >
                    {currentIndex < questions.length - 1 ? (
                      <>
                        Suivant
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      "Voir les résultats"
                    )}
                  </Button>
                )}
              </div>

              <div className="flex justify-center">
                <Button variant="link" onClick={onExit} className="text-muted-foreground hover:text-destructive transition-colors">
                  Quitter la session
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
