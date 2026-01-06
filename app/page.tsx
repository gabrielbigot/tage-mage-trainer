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
import { PracticeMode } from "@/components/practice-mode";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/auth/user-nav";
import { AuthForm } from "@/components/auth/auth-form";
import { ImportExport } from "@/components/import-export";
import { BookOpen, Brain, Home, BarChart3, RefreshCw, Loader2, Timer, ArrowRight, Sparkles } from "lucide-react";
import { Question } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";

type View = "home" | "manage" | "manage-add" | "manage-view" | "practice" | "train" | "stats" | "review" | "exam";

export default function HomePage() {
  const [view, setView] = useState<View>("home");
  const [refreshKey, setRefreshKey] = useState(0);
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([]);
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(0);
  const { user, loading } = useAuth();

  const handleQuestionAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setView("manage-add");
    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setView("manage-view");
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

  const handleStartPractice = (questions: Question[]) => {
    setPracticeQuestions(questions);
    setView("train");
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  // Show auth form if not logged in
  if (!user) {
    return <AuthForm />;
  }

  const renderContent = () => {
    switch (view) {
      case "train":
        const customQuestions = examQuestions.length > 0
          ? examQuestions
          : reviewQuestions.length > 0
          ? reviewQuestions
          : practiceQuestions;
        const sessionMode = examQuestions.length > 0
          ? "exam"
          : reviewQuestions.length > 0
          ? "review"
          : "practice";
        return (
          <div className="max-w-3xl mx-auto">
            <TrainingSession
              onExit={() => {
                setView("home");
                setReviewQuestions([]);
                setPracticeQuestions([]);
                setExamQuestions([]);
                setTimePerQuestion(0);
              }}
              mode={sessionMode}
              customQuestions={customQuestions.length > 0 ? customQuestions : undefined}
              timePerQuestion={timePerQuestion}
            />
          </div>
        );
      case "practice":
        return (
          <div className="max-w-6xl mx-auto">
            <PracticeMode
              onStartPractice={handleStartPractice}
              onBack={() => setView("home")}
            />
          </div>
        );
      case "exam":
        return (
          <div className="max-w-6xl mx-auto">
            <ExamMode
              onStartExam={handleStartExam}
              onBack={() => setView("home")}
            />
          </div>
        );
      case "manage":
        return (
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Gérer mes questions</h1>
                <p className="text-muted-foreground">
                  Ajoutez et organisez vos questions d&apos;entraînement
                </p>
              </div>
              <Button variant="outline" onClick={() => setView("home")} className="gap-2">
                <Home className="h-4 w-4" />
                Accueil
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card
                  className="h-full border-white/5 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all hover:shadow-xl hover:-translate-y-1 group cursor-pointer"
                  onClick={() => setView("manage-add")}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-3 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </div>
                    <CardTitle className="text-xl">Ajouter des questions</CardTitle>
                    <CardDescription>Créez de nouvelles questions ou importez-les en masse</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className="w-full justify-between group-hover:bg-primary/5">
                      Ajouter
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card
                  className="h-full border-white/5 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all hover:shadow-xl hover:-translate-y-1 group cursor-pointer"
                  onClick={() => setView("manage-view")}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-3 rounded-xl bg-purple-500/10 group-hover:scale-110 transition-transform">
                        <Brain className="h-6 w-6 text-purple-500" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </div>
                    <CardTitle className="text-xl">Voir les questions</CardTitle>
                    <CardDescription>Consultez, modifiez et supprimez vos questions existantes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className="w-full justify-between group-hover:bg-primary/5">
                      Consulter
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        );
      case "manage-add":
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Ajouter des questions</h1>
                <p className="text-muted-foreground">
                  Créez une nouvelle question ou importez un fichier
                </p>
              </div>
              <Button variant="outline" onClick={() => setView("manage")} className="gap-2">
                <ArrowRight className="h-4 w-4 rotate-180" />
                Retour
              </Button>
            </div>

            <div className="space-y-6">
              <QuestionForm
                onQuestionAdded={handleQuestionAdded}
                editQuestion={editingQuestion}
                onCancelEdit={handleCancelEdit}
              />
              <ImportExport onDataChanged={handleQuestionAdded} />
            </div>
          </div>
        );
      case "manage-view":
        return (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Mes questions</h1>
                <p className="text-muted-foreground">
                  Gérez votre banque de questions personnelle
                </p>
              </div>
              <Button variant="outline" onClick={() => setView("manage")} className="gap-2">
                <ArrowRight className="h-4 w-4 rotate-180" />
                Retour
              </Button>
            </div>

            <QuestionList
              refresh={refreshKey}
              onEdit={handleEditQuestion}
            />
          </div>
        );
      case "stats":
        return (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Statistiques</h1>
                <p className="text-muted-foreground">
                  Suivez votre progression et vos performances
                </p>
              </div>
              <Button variant="outline" onClick={() => setView("home")} className="gap-2">
                <Home className="h-4 w-4" />
                Accueil
              </Button>
            </div>

            <StatisticsView />
          </div>
        );
      case "review":
        return (
          <div className="max-w-6xl mx-auto space-y-6">
            <ReviewMode
              onStartReview={handleStartReview}
              onBack={() => setView("home")}
            />
          </div>
        );
      default:
        return (
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-6 py-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent pb-2">
                  TAGE MAGE Trainer
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground mt-4 max-w-2xl mx-auto">
                  L&apos;outil ultime pour maîtriser le TAGE MAGE avec une expérience premium.
                </p>
              </motion.div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Entraînement",
                  description: "Configurez votre session personnalisée",
                  icon: Brain,
                  action: () => setView("practice"),
                  color: "text-primary",
                  bg: "bg-primary/10",
                  btnText: "Configurer"
                },
                {
                  title: "Mode Examen",
                  description: "Conditions réelles chronométrées",
                  icon: Timer,
                  action: () => setView("exam"),
                  color: "text-red-500",
                  bg: "bg-red-500/10",
                  btnText: "Se tester"
                },
                {
                  title: "Révision",
                  description: "Ciblez vos erreurs et points faibles",
                  icon: RefreshCw,
                  action: () => setView("review"),
                  color: "text-orange-500",
                  bg: "bg-orange-500/10",
                  btnText: "Réviser"
                },
                {
                  title: "Statistiques",
                  description: "Analysez votre progression détaillée",
                  icon: BarChart3,
                  action: () => setView("stats"),
                  color: "text-blue-500",
                  bg: "bg-blue-500/10",
                  btnText: "Voir"
                },
                {
                  title: "Bibliothèque",
                  description: "Gérez vos questions et imports",
                  icon: BookOpen,
                  action: () => setView("manage"),
                  color: "text-purple-500",
                  bg: "bg-purple-500/10",
                  btnText: "Gérer"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full border-white/5 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all hover:shadow-xl hover:-translate-y-1 group cursor-pointer" onClick={item.action}>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-3 rounded-xl ${item.bg} group-hover:scale-110 transition-transform`}>
                          <item.icon className={`h-6 w-6 ${item.color}`} />
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </div>
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" className="w-full justify-between group-hover:bg-primary/5">
                        {item.btnText}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* Feature Highlight Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="h-full border-none bg-gradient-to-br from-primary/20 to-purple-600/20 backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-yellow-400" />
                      <span className="text-sm font-bold text-yellow-400 uppercase tracking-wider">Premium</span>
                    </div>
                    <CardTitle className="text-xl">Nouveau Design</CardTitle>
                    <CardDescription className="text-foreground/80">
                      Profitez d&apos;une interface fluide et moderne pour une meilleure concentration.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <ThemeToggle />
        <UserNav />
      </div>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10 opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -z-10 opacity-50 pointer-events-none" />

        <div className="p-4 md:p-8 pt-20 md:pt-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
