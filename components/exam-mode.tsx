"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Question } from "@/lib/types";
import { storage } from "@/lib/storage";
import { Clock, Play, ArrowLeft } from "lucide-react";

interface ExamModeProps {
  onStartExam: (questions: Question[], timePerQuestion: number) => void;
  onBack: () => void;
}

export function ExamMode({ onStartExam, onBack }: ExamModeProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(90); // seconds
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const allQuestions = await storage.getQuestions();
    setQuestions(allQuestions);
  };

  const handleStart = async () => {
    let filtered = questions;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(q => q.category === selectedCategory);
    }

    // Filter by difficulty
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }

    // Shuffle and select
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    if (selected.length === 0) {
      alert("Aucune question disponible avec ces critères");
      return;
    }

    onStartExam(selected, timePerQuestion);
  };

  const categories = ["all", ...Array.from(new Set(questions.map(q => q.category)))];
  const totalTime = questionCount * timePerQuestion;
  const totalMinutes = Math.floor(totalTime / 60);
  const totalSeconds = totalTime % 60;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mode Examen</h1>
          <p className="text-muted-foreground">
            Entraînez-vous avec un temps limité par question
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration de l'examen</CardTitle>
            <CardDescription>
              Personnalisez les paramètres de votre session chronométrée
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="questionCount">Nombre de questions</Label>
              <Input
                id="questionCount"
                type="number"
                min="1"
                max={questions.length}
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <p className="text-xs text-muted-foreground">
                Maximum : {questions.length} questions disponibles
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timePerQuestion">Temps par question (secondes)</Label>
              <div className="flex gap-2">
                <Input
                  id="timePerQuestion"
                  type="number"
                  min="10"
                  max="300"
                  value={timePerQuestion}
                  onChange={(e) => setTimePerQuestion(Math.max(10, parseInt(e.target.value) || 90))}
                />
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTimePerQuestion(60)}
                  >
                    1 min
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTimePerQuestion(90)}
                  >
                    1.5 min
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTimePerQuestion(120)}
                  >
                    2 min
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat === "all" ? "Toutes" : cat}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Difficulté</Label>
              <div className="flex gap-2">
                <Button
                  variant={selectedDifficulty === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDifficulty("all")}
                >
                  Toutes
                </Button>
                <Button
                  variant={selectedDifficulty === "easy" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDifficulty("easy")}
                >
                  Facile
                </Button>
                <Button
                  variant={selectedDifficulty === "medium" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDifficulty("medium")}
                >
                  Moyen
                </Button>
                <Button
                  variant={selectedDifficulty === "hard" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDifficulty("hard")}
                >
                  Difficile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Résumé de l'examen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Questions</span>
                <span className="text-2xl font-bold text-primary">{questionCount}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Temps par question</span>
                <span className="text-2xl font-bold text-primary">
                  {timePerQuestion < 60 ? `${timePerQuestion}s` : `${Math.floor(timePerQuestion / 60)}:${(timePerQuestion % 60).toString().padStart(2, '0')}`}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border-2 border-primary">
                <span className="text-sm font-medium">Durée totale</span>
                <span className="text-2xl font-bold text-primary">
                  {totalMinutes > 0 ? `${totalMinutes} min ${totalSeconds > 0 ? totalSeconds + 's' : ''}` : `${totalSeconds}s`}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Le chronomètre démarre automatiquement</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span>Alerte à 10 secondes restantes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>Passage automatique à la fin du temps</span>
              </div>
            </div>

            <Button
              onClick={handleStart}
              className="w-full"
              size="lg"
              disabled={questions.length === 0}
            >
              <Play className="h-5 w-5 mr-2" />
              Démarrer l'examen
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
