"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/storage";
import { TrainingSession, Question } from "@/lib/types";
import { ArrowLeft, Clock, CheckCircle2, XCircle, Trophy, Calendar, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface SessionResult {
  questionId: string;
  userAnswer: number | null;
  isCorrect: boolean;
  timeSpent: number;
}

interface QuestionWithResult {
  question: Question;
  result: SessionResult;
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [questionsWithResults, setQuestionsWithResults] = useState<QuestionWithResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessionDetails();
  }, [sessionId]);

  const loadSessionDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get session details from Supabase
      const sessionData = await storage.getSessionDetails(sessionId);
      if (!sessionData) {
        setError("Session non trouvée");
        return;
      }

      setSession(sessionData.session);

      // Get all questions from Notion
      const allQuestions = await storage.getQuestions();

      // Create a map for quick lookup
      const questionMap = new Map(allQuestions.map(q => [q.id, q]));

      // Match results with questions
      const matched: QuestionWithResult[] = [];
      for (const result of sessionData.results) {
        const question = questionMap.get(result.questionId);
        if (question) {
          matched.push({ question, result });
        }
      }

      setQuestionsWithResults(matched);
    } catch (err) {
      console.error("Error loading session details:", err);
      setError("Erreur lors du chargement de la session");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}min`;
    if (minutes > 0) return `${minutes}min ${secs}s`;
    return `${secs}s`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getModeLabel = (mode?: string): string => {
    switch (mode) {
      case "sprint": return "Sprint";
      case "daily-challenge": return "Défi quotidien";
      case "exam": return "Examen";
      case "review": return "Révision";
      case "spaced-review": return "Répétition espacée";
      case "practice": return "Entraînement";
      default: return "Session";
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de la session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Session non trouvée"}</p>
          <Button onClick={() => router.push("/")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux statistiques
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/")}
        className="mb-6 hover:bg-muted"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux statistiques
      </Button>

      {/* Session Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card className="border-white/10 bg-gradient-to-br from-card to-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6 text-primary" />
              {getModeLabel(session.mode)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Score */}
              <div className="text-center p-4 rounded-lg bg-background/50">
                <p className={`text-3xl font-bold ${getScoreColor(session.score || 0)}`}>
                  {session.score}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Score</p>
              </div>

              {/* Questions */}
              <div className="text-center p-4 rounded-lg bg-background/50">
                <p className="text-3xl font-bold text-primary">
                  {session.correctAnswers}/{session.totalQuestions}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Bonnes réponses</p>
              </div>

              {/* Duration */}
              <div className="text-center p-4 rounded-lg bg-background/50">
                <p className="text-3xl font-bold text-blue-500">
                  {formatTime(session.totalTime || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Durée</p>
              </div>

              {/* Date */}
              <div className="text-center p-4 rounded-lg bg-background/50">
                <div className="flex items-center justify-center mb-1">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">
                  {session.completedAt
                    ? new Date(session.completedAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })
                    : "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.completedAt
                    ? new Date(session.completedAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Questions List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">
          Détail des questions ({questionsWithResults.length})
        </h2>

        {questionsWithResults.length === 0 ? (
          <Card className="border-white/5">
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                Les détails des questions ne sont plus disponibles
              </p>
            </CardContent>
          </Card>
        ) : (
          questionsWithResults.map((item, index) => (
            <motion.div
              key={item.result.questionId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.5) }}
            >
              <Card className={`border-white/5 ${
                item.result.isCorrect
                  ? "border-l-4 border-l-green-500"
                  : "border-l-4 border-l-red-500"
              }`}>
                <CardContent className="pt-6">
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        Question {index + 1}/{questionsWithResults.length}
                      </span>
                      {item.question.category && (
                        <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {item.question.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {item.result.timeSpent}s
                      </div>
                      {item.result.isCorrect ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="font-medium mb-4">{item.question.question}</p>

                  {/* Options */}
                  <div className="space-y-2">
                    {item.question.options.map((option, optIndex) => {
                      const isCorrectAnswer = optIndex === item.question.correctAnswer;
                      const isUserAnswer = optIndex === item.result.userAnswer;

                      let bgColor = "bg-muted/30";
                      let textColor = "text-foreground";
                      let borderColor = "border-transparent";

                      if (isCorrectAnswer) {
                        bgColor = "bg-green-500/10";
                        textColor = "text-green-600 dark:text-green-400";
                        borderColor = "border-green-500";
                      } else if (isUserAnswer && !isCorrectAnswer) {
                        bgColor = "bg-red-500/10";
                        textColor = "text-red-600 dark:text-red-400";
                        borderColor = "border-red-500";
                      }

                      return (
                        <div
                          key={optIndex}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${bgColor} ${borderColor}`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                            isCorrectAnswer
                              ? "border-green-500 text-green-500"
                              : isUserAnswer
                              ? "border-red-500 text-red-500"
                              : "border-muted-foreground/30 text-muted-foreground"
                          }`}>
                            {String.fromCharCode(65 + optIndex)}
                          </div>
                          <span className={`flex-1 ${textColor}`}>{option}</span>
                          {isCorrectAnswer && (
                            <span className="text-xs text-green-500 font-medium">
                              Bonne réponse
                            </span>
                          )}
                          {isUserAnswer && !isCorrectAnswer && (
                            <span className="text-xs text-red-500 font-medium">
                              Votre réponse
                            </span>
                          )}
                          {isUserAnswer && isCorrectAnswer && (
                            <span className="text-xs text-green-500 font-medium">
                              Votre réponse (correcte)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {item.question.explanation && (
                    <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-sm font-medium text-blue-500 mb-2">Explication</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {item.question.explanation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Bottom back button */}
      <div className="mt-8 text-center">
        <Button
          variant="outline"
          onClick={() => router.push("/")}
          size="lg"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux statistiques
        </Button>
      </div>
    </div>
  );
}
