"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/storage";
import { Question } from "@/lib/types";
import { RefreshCw, AlertCircle } from "lucide-react";

interface ReviewModeProps {
  onStartReview: (questions: Question[]) => void;
  onBack: () => void;
}

export function ReviewMode({ onStartReview, onBack }: ReviewModeProps) {
  const [incorrectQuestions, setIncorrectQuestions] = useState<Question[]>([]);

  useEffect(() => {
    loadIncorrectQuestions();
  }, []);

  const loadIncorrectQuestions = async () => {
    const questions = await storage.getIncorrectQuestions(1);
    setIncorrectQuestions(questions);
  };

  const getErrorRate = (question: Question): number => {
    const total = (question.timesCorrect || 0) + (question.timesIncorrect || 0);
    if (total === 0) return 0;
    return Math.round(((question.timesIncorrect || 0) / total) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mode Révision</h2>
          <p className="text-muted-foreground">
            Revoir les questions que vous avez ratées
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Retour
        </Button>
      </div>

      {incorrectQuestions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
                <AlertCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-semibold mb-2">Aucune question à réviser</p>
                <p className="text-muted-foreground">
                  Vous n&apos;avez pas encore raté de question !
                </p>
              </div>
              <Button onClick={onBack} variant="outline">
                Retour à l&apos;accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Questions à réviser ({incorrectQuestions.length})
                </CardTitle>
                <CardDescription>
                  Ces questions nécessitent plus d&apos;attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => onStartReview(incorrectQuestions)}
                    size="lg"
                    className="flex-1 min-w-[200px]"
                  >
                    Réviser toutes ({incorrectQuestions.length})
                  </Button>
                  <Button
                    onClick={() => onStartReview(incorrectQuestions.slice(0, 5))}
                    size="lg"
                    variant="outline"
                    className="flex-1 min-w-[200px]"
                  >
                    Réviser 5 questions
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Détails des questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {incorrectQuestions.map((question) => {
                    const errorRate = getErrorRate(question);

                    return (
                      <div
                        key={question.id}
                        className="p-4 rounded-lg border"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                {question.category}
                              </span>
                              {question.difficulty && (
                                <span className={`text-xs px-2 py-1 rounded ${
                                  question.difficulty === "easy"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                    : question.difficulty === "medium"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                }`}>
                                  {question.difficulty === "easy" ? "Facile" : question.difficulty === "medium" ? "Moyen" : "Difficile"}
                                </span>
                              )}
                            </div>
                            <p className="font-medium mb-2">{question.question}</p>
                            <div className="text-sm text-muted-foreground">
                              Erreurs : {question.timesIncorrect} / {(question.timesCorrect || 0) + (question.timesIncorrect || 0)} ({errorRate}%)
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              errorRate >= 75 ? "text-red-600" : errorRate >= 50 ? "text-orange-600" : "text-yellow-600"
                            }`}>
                              {errorRate}%
                            </div>
                            <div className="text-xs text-muted-foreground">d&apos;erreur</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
