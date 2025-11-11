"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionForm } from "@/components/question-form";
import { QuestionList } from "@/components/question-list";
import { TrainingSession } from "@/components/training-session";
import { StatisticsView } from "@/components/statistics-view";
import { ReviewMode } from "@/components/review-mode";
import { ExamMode } from "@/components/exam-mode";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/auth/user-nav";
import { AuthForm } from "@/components/auth/auth-form";
import { ImportExport } from "@/components/import-export";
import { BookOpen, Brain, Home, BarChart3, RefreshCw, Loader2, Timer } from "lucide-react";
import { Question } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

type View = "home" | "manage" | "train" | "stats" | "review" | "exam";

export default function HomePage() {
  const [view, setView] = useState<View>("home");
  const [refreshKey, setRefreshKey] = useState(0);
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(0);
  const { user, loading } = useAuth();

  const handleQuestionAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
  };

  const handleStartReview = (questions: Question[]) => {
    setReviewQuestions(questions);
    setView("train");
  };

  const handleStartExam = (questions: Question[], timeLimit: number) => {
    setExamQuestions(questions);
    setTimePerQuestion(timeLimit);
    setView("train");
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Show auth form if not logged in
  if (!user) {
    return <AuthForm />;
  }

  // Rest of the app (same as before but with UserNav added)
  if (view === "train") {
    const customQuestions = examQuestions.length > 0 ? examQuestions : reviewQuestions;
    const sessionMode = examQuestions.length > 0 ? "exam" : reviewQuestions.length > 0 ? "review" : "practice";

    return (
      <>
        <ThemeToggle />
        <UserNav />
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            <TrainingSession
              onExit={() => {
                setView("home");
                setReviewQuestions([]);
                setExamQuestions([]);
                setTimePerQuestion(0);
              }}
              mode={sessionMode}
              customQuestions={customQuestions.length > 0 ? customQuestions : undefined}
              timePerQuestion={timePerQuestion}
            />
          </div>
        </div>
      </>
    );
  }

  if (view === "exam") {
    return (
      <>
        <ThemeToggle />
        <UserNav />
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <ExamMode
              onStartExam={handleStartExam}
              onBack={() => setView("home")}
            />
          </div>
        </div>
      </>
    );
  }

  if (view === "manage") {
    return (
      <>
        <ThemeToggle />
        <UserNav />
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Gérer mes questions</h1>
              <p className="text-muted-foreground">
                Ajoutez et organisez vos questions d&apos;entraînement
              </p>
            </div>
            <Button variant="outline" onClick={() => setView("home")}>
              <Home className="h-4 w-4 mr-2" />
              Accueil
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <QuestionForm
                onQuestionAdded={handleQuestionAdded}
                editQuestion={editingQuestion}
                onCancelEdit={handleCancelEdit}
              />
              <ImportExport onDataChanged={handleQuestionAdded} />
            </div>
            <div>
              <QuestionList
                refresh={refreshKey}
                onEdit={handleEditQuestion}
              />
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (view === "stats") {
    return (
      <>
        <ThemeToggle />
        <UserNav />
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Statistiques</h1>
              <p className="text-muted-foreground">
                Suivez votre progression et vos performances
              </p>
            </div>
            <Button variant="outline" onClick={() => setView("home")}>
              <Home className="h-4 w-4 mr-2" />
              Accueil
            </Button>
          </div>

          <StatisticsView />
        </div>
      </div>
      </>
    );
  }

  if (view === "review") {
    return (
      <>
        <ThemeToggle />
        <UserNav />
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <ReviewMode
            onStartReview={handleStartReview}
            onBack={() => setView("home")}
          />
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <ThemeToggle />
      <UserNav />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            TAGE MAGE Trainer
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Entraînez-vous efficacement avec vos propres questions
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="hover:shadow-lg transition-all border-2 hover:border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Questions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Gérez votre bibliothèque de questions
              </CardDescription>
              <Button onClick={() => setView("manage")} className="w-full">
                Accéder
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all border-2 hover:border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Entraînement</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Session avec questions aléatoires
              </CardDescription>
              <Button onClick={() => setView("train")} className="w-full">
                Démarrer
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all border-2 hover:border-red-500/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                  <Timer className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-lg">Examen</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Mode chronométré pour s'entraîner
              </CardDescription>
              <Button
                onClick={() => setView("exam")}
                className="w-full"
                variant="destructive"
              >
                Démarrer
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all border-2 hover:border-orange-500/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <RefreshCw className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Révision</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Revoir les questions ratées
              </CardDescription>
              <Button
                onClick={() => setView("review")}
                className="w-full"
                variant="outline"
              >
                Réviser
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all border-2 hover:border-blue-500/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Statistiques</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Suivez votre progression
              </CardDescription>
              <Button
                onClick={() => setView("stats")}
                className="w-full"
                variant="outline"
              >
                Voir
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">📝</div>
                <h3 className="font-semibold mb-1">Créez vos questions</h3>
                <p className="text-sm text-muted-foreground">
                  Ajoutez les questions du TAGE MAGE
                </p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">🎯</div>
                <h3 className="font-semibold mb-1">Entraînez-vous</h3>
                <p className="text-sm text-muted-foreground">
                  Sessions avec questions aléatoires
                </p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">🔄</div>
                <h3 className="font-semibold mb-1">Révisez vos erreurs</h3>
                <p className="text-sm text-muted-foreground">
                  Ciblez vos points faibles
                </p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">📊</div>
                <h3 className="font-semibold mb-1">Progressez</h3>
                <p className="text-sm text-muted-foreground">
                  Suivez vos performances
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
