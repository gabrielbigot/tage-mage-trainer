"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Question, QuestionResult, SessionMode } from "@/lib/types";
import { storage } from "@/lib/storage";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, BookOpen } from "lucide-react";
import Link from "next/link";

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            Session terminée !
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-primary">{percentage}%</div>
            <p className="text-xl">
              {score} / {questions.length} bonnes réponses
            </p>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Temps total : {formatTime(totalTime)}</span>
            </div>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const userAnswer = answers[idx];
              const isCorrect = userAnswer === q.correctAnswer;

              return (
                <Card key={q.id} className={isCorrect ? "border-green-500" : "border-red-500"}>
                  <CardContent className="pt-6 space-y-2">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded ${
                        isCorrect
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                      }`}>
                        {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                      </span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {q.category}
                      </span>
                      {questionTimes[idx] > 0 && (
                        <span className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(questionTimes[idx])}
                        </span>
                      )}
                    </div>
                    <p className="font-medium">{q.question}</p>
                    {q.imageUrl && (
                      <div className="my-2">
                        <img
                          src={q.imageUrl}
                          alt="Question"
                          className="w-full max-h-48 object-contain border rounded-lg bg-muted"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`text-sm px-3 py-1 rounded ${
                            optIdx === q.correctAnswer
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              : optIdx === userAnswer
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                              : "bg-muted"
                          }`}
                        >
                          {optIdx === q.correctAnswer && "✓ "}
                          {optIdx === userAnswer && optIdx !== q.correctAnswer && "✗ "}
                          {opt}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <p className="text-sm text-muted-foreground italic mt-2">
                        {q.explanation}
                      </p>
                    )}
                    <div className="mt-3 pt-3 border-t">
                      <Link href={`/correction/${q.id}`} target="_blank">
                        <Button variant="outline" size="sm" className="w-full">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Voir la correction détaillée
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Button onClick={onExit} variant="outline" className="flex-1">
              Retour à l&apos;accueil
            </Button>
            <Button
              onClick={() => {
                window.location.reload();
              }}
              className="flex-1"
            >
              Nouvelle session
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Question {currentIndex + 1} / {questions.length}
          </CardTitle>
          <div className="flex items-center gap-4">
            {timePerQuestion > 0 && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg font-mono text-lg font-bold ${
                timeRemaining <= 10
                  ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-100 animate-pulse"
                  : timeRemaining <= 30
                  ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-100"
                  : "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-100"
              }`}>
                <Clock className="h-5 w-5" />
                <span>
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
            <span className="text-sm text-muted-foreground">{currentQuestion.category}</span>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mt-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <p className="text-lg font-medium">{currentQuestion.question}</p>

          {currentQuestion.imageUrl && (
            <div className="my-4">
              <img
                src={currentQuestion.imageUrl}
                alt="Question"
                className="w-full max-h-96 object-contain border rounded-lg bg-muted"
              />
            </div>
          )}

          <div className="space-y-2">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showCorrect = showAnswer && isCorrect;
              const showIncorrect = showAnswer && isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showAnswer}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                    showCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-950"
                      : showIncorrect
                      ? "border-red-500 bg-red-50 dark:bg-red-950"
                      : isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  } ${showAnswer ? "cursor-default" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-2">
                    {showCorrect && <span className="text-green-600">✓</span>}
                    {showIncorrect && <span className="text-red-600">✗</span>}
                    <span>{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {showAnswer && currentQuestion.explanation && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-1">Explication :</p>
              <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>

          <div className="flex-1" />

          {!showAnswer ? (
            <Button onClick={handleValidate}>Valider</Button>
          ) : (
            <Button onClick={handleNext}>
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

        <Button variant="ghost" onClick={onExit} className="w-full">
          Quitter la session
        </Button>
      </CardContent>
    </Card>
  );
}
