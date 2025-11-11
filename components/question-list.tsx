"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Question } from "@/lib/types";
import { storage } from "@/lib/storage";
import { Trash2, Edit, Search, X, BookOpen } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

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
            <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Mes questions ({questions.length})</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-sm"
            >
              <X className="h-4 w-4 mr-1" />
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Rechercher dans les questions, options, explications... (Appuyez sur / pour chercher)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results count */}
        {searchTerm && (
          <div className="text-sm text-muted-foreground">
            {filteredQuestions.length} résultat{filteredQuestions.length > 1 ? 's' : ''} trouvé{filteredQuestions.length > 1 ? 's' : ''}
            {filteredQuestions.length !== questions.length && ` sur ${questions.length} questions`}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">Filtrer par catégorie</p>
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

          {tags.length > 1 && (
            <div>
              <p className="text-sm font-medium mb-2">Filtrer par tag</p>
              <div className="flex gap-2 flex-wrap">
                {tags.map((tag) => (
                  <Button
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTag(tag)}
                  >
                    {tag === "all" ? "Tous" : `#${tag}`}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {filteredQuestions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm || selectedCategory !== "all" || selectedTag !== "all"
                ? "Aucune question ne correspond à vos critères de recherche"
                : "Aucune question pour le moment"}
            </p>
          ) : (
            filteredQuestions.map((q) => (
              <Card key={q.id} className="relative">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {q.category}
                        </span>
                        {q.difficulty && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            q.difficulty === "easy"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              : q.difficulty === "medium"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                          }`}>
                            {q.difficulty === "easy" ? "Facile" : q.difficulty === "medium" ? "Moyen" : "Difficile"}
                          </span>
                        )}
                        {q.tags && q.tags.length > 0 && (
                          <>
                            {q.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </>
                        )}
                        {q.isFavorite && (
                          <span className="text-xs text-yellow-500">⭐</span>
                        )}
                      </div>
                      <p className="font-medium">{highlightText(q.question)}</p>
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
                        {q.options.map((opt, idx) => (
                          <div
                            key={idx}
                            className={`text-sm px-3 py-1 rounded ${
                              idx === q.correctAnswer
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                : "bg-muted"
                            }`}
                          >
                            {idx === q.correctAnswer && "✓ "}
                            {highlightText(opt)}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="text-sm text-muted-foreground italic">
                          {highlightText(q.explanation)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/correction/${q.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Voir la correction détaillée"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit?.(q)}
                        className="text-primary hover:text-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(q.id)}
                        className="text-destructive hover:text-destructive"
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
