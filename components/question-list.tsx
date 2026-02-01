"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Question } from "@/lib/types";
import { storage } from "@/lib/storage";
import { Trash2, Edit, Search, X, BookOpen, Filter } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DoubleSeriesDisplay } from "@/components/double-series-display";
import { ConditionsMinimalesDisplay } from "@/components/conditions-minimales-display";

interface QuestionListProps {
  refresh?: number;
  onEdit?: (question: Question) => void;
}

export function QuestionList({ refresh, onEdit }: QuestionListProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadQuestions();
  }, [refresh]);

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadQuestions = async () => {
    const allQuestions = await storage.getQuestions();
    setQuestions(allQuestions);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette question ?")) {
      await storage.deleteQuestion(id);
      await loadQuestions();
    }
  };

  const categories = ["all", ...Array.from(new Set(questions.map((q) => q.category)))];

  // Get all unique tags from all questions
  const allTags = Array.from(
    new Set(
      questions.flatMap((q) => q.tags || [])
    )
  ).sort();
  const tags = ["all", ...allTags];

  // Filter by category, tag, and search term
  const filteredQuestions = questions.filter((q) => {
    const categoryMatch = selectedCategory === "all" || q.category === selectedCategory;
    const tagMatch = selectedTag === "all" || (q.tags && q.tags.includes(selectedTag));

    // Search in question text, options, explanation, category, and tags
    const searchLower = searchTerm.toLowerCase();
    const searchMatch = searchTerm === "" ||
      q.question.toLowerCase().includes(searchLower) ||
      q.options.some(opt => opt.toLowerCase().includes(searchLower)) ||
      (q.explanation && q.explanation.toLowerCase().includes(searchLower)) ||
      q.category.toLowerCase().includes(searchLower) ||
      (q.tags && q.tags.some(tag => tag.toLowerCase().includes(searchLower)));

    return categoryMatch && tagMatch && searchMatch;
  });

  // Highlight search term in text
  const highlightText = (text: string) => {
    if (!searchTerm || searchTerm.trim() === "") {
      return text;
    }

    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark key={index} className="bg-yellow-500/30 text-yellow-700 dark:text-yellow-300 px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  const hasActiveFilters = searchTerm || selectedCategory !== "all" || selectedTag !== "all";

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedTag("all");
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-2xl flex items-center gap-2">
            Mes questions
            <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {questions.length}
            </span>
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-sm hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          )}
        </div>

        {/* Search bar */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Rechercher... (Appuyez sur /)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 bg-card/50 backdrop-blur-sm border-white/10 focus:border-primary/50 transition-all h-12"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-0 space-y-6">
        {/* Filters */}
        <div className="space-y-4 bg-card/30 p-4 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <Filter className="h-4 w-4" />
            Filtres
          </div>

          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                      : "bg-background/50 text-muted-foreground border-transparent hover:border-border hover:bg-background"
                  )}
                >
                  {cat === "all" ? "Toutes les catégories" : cat}
                </button>
              ))}
            </div>

            {tags.length > 1 && (
              <div className="flex gap-2 flex-wrap pt-2 border-t border-white/5">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs transition-all",
                      selectedTag === tag
                        ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {tag === "all" ? "#Tous" : `#${tag}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results count */}
        {searchTerm && (
          <div className="text-sm text-muted-foreground px-1">
            Found {filteredQuestions.length} result{filteredQuestions.length !== 1 ? 's' : ''}
          </div>
        )}

        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12 bg-card/30 rounded-xl border border-dashed border-white/10">
              <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">
                {searchTerm || selectedCategory !== "all" || selectedTag !== "all"
                  ? "Aucune question ne correspond à vos critères"
                  : "Votre bibliothèque est vide"}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Essayez de modifier vos filtres ou ajoutez une nouvelle question
              </p>
            </div>
          ) : (
            filteredQuestions.map((q) => (
              <Card key={q.id} className="group border-white/5 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all hover:shadow-lg hover:border-primary/20">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/10">
                          {q.category}
                        </span>
                        {q.difficulty && (
                          <span className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-medium border",
                            q.difficulty === "easy"
                              ? "bg-green-500/10 text-green-600 border-green-500/10"
                              : q.difficulty === "medium"
                                ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/10"
                                : "bg-red-500/10 text-red-600 border-red-500/10"
                          )}>
                            {q.difficulty === "easy" ? "Facile" : q.difficulty === "medium" ? "Moyen" : "Difficile"}
                          </span>
                        )}
                        {q.tags && q.tags.length > 0 && (
                          <div className="flex gap-1">
                            {q.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs text-muted-foreground px-1.5 py-0.5"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <p className="font-medium text-lg leading-relaxed">{highlightText(q.question)}</p>

                      {q.questionType === "double-series" && q.doubleSeriesData && (
                        <div className="my-3">
                          <DoubleSeriesDisplay data={q.doubleSeriesData} />
                        </div>
                      )}

                      {q.questionType === "conditions-minimales" && q.conditionsMinimalesData && (
                        <div className="my-3">
                          <ConditionsMinimalesDisplay data={q.conditionsMinimalesData} />
                        </div>
                      )}

                      {q.imageUrl && (
                        <div className="my-3 rounded-lg overflow-hidden border bg-muted/50 max-w-md">
                          <img
                            src={q.imageUrl}
                            alt="Question"
                            className="w-full max-h-48 object-contain"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "text-sm px-3 py-2 rounded-lg border transition-colors",
                              idx === q.correctAnswer
                                ? "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20"
                                : "bg-muted/30 border-transparent text-muted-foreground"
                            )}
                          >
                            <span className="font-mono text-xs mr-2 opacity-50">{String.fromCharCode(65 + idx)}.</span>
                            {highlightText(opt)}
                          </div>
                        ))}
                      </div>

                      {q.explanation && (
                        <div className="bg-muted/30 p-3 rounded-lg text-sm text-muted-foreground border border-white/5">
                          <span className="font-semibold text-primary/80 mr-1">Explication:</span>
                          {highlightText(q.explanation)}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/correction/${q.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit?.(q)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(q.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
