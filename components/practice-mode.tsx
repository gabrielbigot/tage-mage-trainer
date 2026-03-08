"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Question } from "@/lib/types";
import { storage } from "@/lib/storage";
import { Brain, Play, ArrowLeft, Filter } from "lucide-react";
import { DateFilter, DateFilterValue, matchesDateFilter } from "@/components/date-filter";

interface PracticeModeProps {
  onStartPractice: (questions: Question[]) => void;
  onBack: () => void;
}

export function PracticeMode({ onStartPractice, onBack }: PracticeModeProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [allSchemaTags, setAllSchemaTags] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({ mode: "all" });

  useEffect(() => {
    loadQuestions();
    loadSchema();
  }, []);

  const loadQuestions = async () => {
    const allQuestions = await storage.getQuestions();
    setQuestions(allQuestions);
  };

  const loadSchema = async () => {
    try {
      const response = await fetch("/api/notion/schema");
      if (response.ok) {
        const data = await response.json();
        setAllSchemaTags(data.tags || []);
      }
    } catch (error) {
      console.error("Error loading schema:", error);
    }
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

    // Filter by question type
    if (selectedType !== "all") {
      filtered = filtered.filter(q => {
        const qType = q.questionType || "standard";
        return qType === selectedType;
      });
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(q => {
        const qTags = q.tags || [];
        return selectedTags.some(tag => qTags.includes(tag));
      });
    }

    // Filter by favorites
    if (favoritesOnly) {
      filtered = filtered.filter(q => q.isFavorite === true);
    }

    // Filter by date
    if (dateFilter.mode !== "all") {
      filtered = filtered.filter(q => matchesDateFilter(q.addedDate, dateFilter));
    }

    // Shuffle and select
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    if (selected.length === 0) {
      alert("Aucune question disponible avec ces critères");
      return;
    }

    onStartPractice(selected);
  };

  // Extract unique values
  const categories = ["all", ...Array.from(new Set(questions.map(q => q.category)))];

  // Get tags: use schema tags as base, filtered by selected category
  const getDisplayedTags = () => {
    if (selectedCategory === "all") {
      // Show all tags from schema, plus any from questions not in schema
      const questionTags = Array.from(new Set(questions.flatMap(q => q.tags || [])));
      const merged = new Set([...allSchemaTags, ...questionTags]);
      return Array.from(merged);
    }
    // When a category is selected, show only tags used by questions in that category
    const categoryQuestions = questions.filter(q => q.category === selectedCategory);
    return Array.from(new Set(categoryQuestions.flatMap(q => q.tags || [])));
  };
  const displayedTags = getDisplayedTags();

  // Clear selected tags that are no longer available when category changes
  useEffect(() => {
    if (selectedTags.length > 0) {
      const validTags = selectedTags.filter(tag => displayedTags.includes(tag));
      if (validTags.length !== selectedTags.length) {
        setSelectedTags(validTags);
      }
    }
  }, [selectedCategory]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Calculate available questions with current filters
  const getFilteredCount = () => {
    let filtered = questions;
    if (selectedCategory !== "all") filtered = filtered.filter(q => q.category === selectedCategory);
    if (selectedDifficulty !== "all") filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    if (selectedType !== "all") filtered = filtered.filter(q => (q.questionType || "standard") === selectedType);
    if (selectedTags.length > 0) filtered = filtered.filter(q => selectedTags.some(tag => (q.tags || []).includes(tag)));
    if (favoritesOnly) filtered = filtered.filter(q => q.isFavorite === true);
    if (dateFilter.mode !== "all") filtered = filtered.filter(q => matchesDateFilter(q.addedDate, dateFilter));
    return filtered.length;
  };

  const availableCount = getFilteredCount();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mode Entraînement</h1>
          <p className="text-muted-foreground">
            Configurez votre session de pratique personnalisée
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
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
            <CardDescription>
              Sélectionnez les critères pour vos questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  variant={selectedType === "graphic-series" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType("graphic-series")}
                >
                  Séries graphiques
                </Button>
              </div>
            </div>

            {displayedTags.length > 0 && (
              <div className="space-y-2">
                <Label>Tags {selectedCategory !== "all" && <span className="text-xs text-muted-foreground font-normal">({selectedCategory})</span>}</Label>
                <div className="flex gap-2 flex-wrap">
                  {displayedTags.map((tag) => (
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
                {selectedTags.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedTags.length} tag(s) sélectionné(s)
                  </p>
                )}
              </div>
            )}

            <DateFilter
              availableDates={questions.map(q => q.addedDate).filter((d): d is string => !!d)}
              value={dateFilter}
              onChange={setDateFilter}
            />

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="space-y-0.5">
                <Label htmlFor="favorites-only">Favoris uniquement</Label>
                <p className="text-xs text-muted-foreground">
                  Afficher seulement les questions favorites
                </p>
              </div>
              <Switch
                id="favorites-only"
                checked={favoritesOnly}
                onCheckedChange={setFavoritesOnly}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="questionCount">Nombre de questions</Label>
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

              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border-2 border-primary">
                <span className="text-sm font-medium">Questions disponibles</span>
                <span className="text-2xl font-bold text-primary">
                  {availableCount}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Pas de limite de temps</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Réponses et explications affichées</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span>Progression sauvegardée</span>
              </div>
            </div>

            <Button
              onClick={handleStart}
              className="w-full"
              size="lg"
              disabled={availableCount === 0}
            >
              <Play className="h-5 w-5 mr-2" />
              Commencer l&apos;entraînement
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
