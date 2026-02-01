"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { storage } from "@/lib/storage";
import { Question } from "@/lib/types";
import { RefreshCw, AlertCircle, Filter, ArrowLeft, Play, TrendingDown } from "lucide-react";

interface ReviewModeProps {
  onStartReview: (questions: Question[]) => void;
  onBack: () => void;
}

export function ReviewMode({ onStartReview, onBack }: ReviewModeProps) {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [errorRateFilter, setErrorRateFilter] = useState<string>("all"); // all, never-correct, high-error (>50%), any-error
  const [minErrorRate, setMinErrorRate] = useState(0); // 0-100

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const questions = await storage.getQuestions();
    setAllQuestions(questions);
  };

  const getErrorRate = (question: Question): number => {
    const total = (question.timesCorrect || 0) + (question.timesIncorrect || 0);
    if (total === 0) return 0;
    return Math.round(((question.timesIncorrect || 0) / total) * 100);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleStart = () => {
    const filtered = getFilteredQuestions();
    const selected = filtered.slice(0, Math.min(questionCount, filtered.length));

    if (selected.length === 0) {
      alert("Aucune question à réviser avec ces critères");
      return;
    }

    onStartReview(selected);
  };

  const getFilteredQuestions = (): Question[] => {
    let filtered = allQuestions;

    // Filter by error rate type
    if (errorRateFilter === "never-correct") {
      // Questions jamais réussies
      filtered = filtered.filter(q => (q.timesCorrect || 0) === 0 && (q.timesIncorrect || 0) > 0);
    } else if (errorRateFilter === "high-error") {
      // Questions avec taux d'erreur > 50%
      filtered = filtered.filter(q => {
        const errorRate = getErrorRate(q);
        return errorRate >= 50 && (q.timesIncorrect || 0) > 0;
      });
    } else if (errorRateFilter === "any-error") {
      // Toutes les questions ratées au moins une fois
      filtered = filtered.filter(q => (q.timesIncorrect || 0) > 0);
    } else if (errorRateFilter === "custom") {
      // Taux d'erreur personnalisé
      filtered = filtered.filter(q => {
        const errorRate = getErrorRate(q);
        return errorRate >= minErrorRate && (q.timesIncorrect || 0) > 0;
      });
    } else {
      // "all" - toutes les questions qui ont été vues
      filtered = filtered.filter(q =>
        ((q.timesCorrect || 0) + (q.timesIncorrect || 0)) > 0
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(q => q.category === selectedCategory);
    }

    // Filter by difficulty
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }

    // Filter by question type
    if (selectedType !== "all") {
      filtered = filtered.filter(q => (q.questionType || "standard") === selectedType);
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(q => {
        const qTags = q.tags || [];
        return selectedTags.some(tag => qTags.includes(tag));
      });
    }

    // Sort by error rate descending (worst first)
    return filtered.sort((a, b) => getErrorRate(b) - getErrorRate(a));
  };

  const categories = ["all", ...Array.from(new Set(allQuestions.map(q => q.category)))];
  const allTags = Array.from(new Set(allQuestions.flatMap(q => q.tags || [])));
  const availableQuestions = getFilteredQuestions();
  const availableCount = availableQuestions.length;

  const totalErrors = allQuestions.filter(q => (q.timesIncorrect || 0) > 0).length;
  const neverCorrect = allQuestions.filter(q => (q.timesCorrect || 0) === 0 && (q.timesIncorrect || 0) > 0).length;
  const highError = allQuestions.filter(q => getErrorRate(q) >= 50 && (q.timesIncorrect || 0) > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mode Révision</h1>
          <p className="text-muted-foreground">
            Révisez vos erreurs de manière ciblée et efficace
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>

      {totalErrors === 0 ? (
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
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres de révision
              </CardTitle>
              <CardDescription>
                Ciblez précisément vos points faibles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type d&apos;erreur</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={errorRateFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setErrorRateFilter("all")}
                    className="justify-start"
                  >
                    Toutes vues
                  </Button>
                  <Button
                    variant={errorRateFilter === "any-error" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setErrorRateFilter("any-error")}
                    className="justify-start"
                  >
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Ratées ({totalErrors})
                  </Button>
                  <Button
                    variant={errorRateFilter === "never-correct" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setErrorRateFilter("never-correct")}
                    className="justify-start"
                  >
                    Jamais réussies ({neverCorrect})
                  </Button>
                  <Button
                    variant={errorRateFilter === "high-error" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setErrorRateFilter("high-error")}
                    className="justify-start"
                  >
                    &gt;50% erreur ({highError})
                  </Button>
                </div>
                <Button
                  variant={errorRateFilter === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setErrorRateFilter("custom")}
                  className="w-full justify-start"
                >
                  Taux personnalisé
                </Button>
                {errorRateFilter === "custom" && (
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="minErrorRate">Taux d&apos;erreur minimum : {minErrorRate}%</Label>
                    <Input
                      id="minErrorRate"
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={minErrorRate}
                      onChange={(e) => setMinErrorRate(parseInt(e.target.value))}
                    />
                  </div>
                )}
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

              <div className="space-y-2">
                <Label>Type de question</Label>
                <div className="flex gap-2">
                  <Button
                    variant={selectedType === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType("all")}
                  >
                    Tous
                  </Button>
                  <Button
                    variant={selectedType === "standard" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType("standard")}
                  >
                    Standard
                  </Button>
                  <Button
                    variant={selectedType === "double-series" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType("double-series")}
                  >
                    Séries doubles
                  </Button>
                  <Button
                    variant={selectedType === "conditions-minimales" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType("conditions-minimales")}
                  >
                    Conditions min.
                  </Button>
                </div>
              </div>

              {allTags.length > 0 && (
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2 flex-wrap">
                    {allTags.map((tag) => (
                      <Button
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="questionCount">Nombre de questions à réviser</Label>
                <Input
                  id="questionCount"
                  type="number"
                  min="1"
                  max={availableCount}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
                />
                <p className="text-xs text-muted-foreground">
                  {availableCount} question(s) disponible(s) avec vos filtres
                </p>
              </div>

              <div className="space-y-2">
                <Label>Raccourcis</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuestionCount(5)}
                    disabled={availableCount < 5}
                  >
                    5 questions
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuestionCount(10)}
                    disabled={availableCount < 10}
                  >
                    10 questions
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuestionCount(20)}
                    disabled={availableCount < 20}
                  >
                    20 questions
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuestionCount(availableCount)}
                    disabled={availableCount === 0}
                  >
                    Toutes ({availableCount})
                  </Button>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Questions sélectionnées</span>
                  <span className="text-2xl font-bold text-primary">
                    {Math.min(questionCount, availableCount)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-orange-500/10 rounded-lg border-2 border-orange-500">
                  <span className="text-sm font-medium">Questions à réviser</span>
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {availableCount}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span>Triées par taux d&apos;erreur décroissant</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Pas de limite de temps</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Explications détaillées affichées</span>
                </div>
              </div>

              <Button
                onClick={handleStart}
                className="w-full"
                size="lg"
                disabled={availableCount === 0}
              >
                <Play className="h-5 w-5 mr-2" />
                Commencer la révision
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
