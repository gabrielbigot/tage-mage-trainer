"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { storage } from "@/lib/storage";
import { Statistics, QuestionType, Question } from "@/lib/types";
import { getReviewStats } from "@/lib/spaced-repetition";
import { Trophy, Target, Clock, TrendingUp, Flame, Calendar, Zap, Brain, BookOpen, GraduationCap, BarChart3, Tag, Layers } from "lucide-react";
import { motion } from "framer-motion";

interface TagStats {
  tag: string;
  totalAnswered: number;
  totalCorrect: number;
  averageScore: number;
  questionCount: number;
}

interface QuestionTypeStatsDisplay {
  type: string;
  label: string;
  totalAnswered: number;
  totalCorrect: number;
  averageScore: number;
  averageTime: number;
  questionCount: number;
}

export function StatisticsView() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [srStats, setSRStats] = useState({
    dueToday: 0,
    newQuestions: 0,
    mastered: 0,
    learning: 0,
    averageMastery: 0,
  });
  const [dailyStreak, setDailyStreak] = useState({
    current: 0,
    longest: 0,
    totalDaysActive: 0,
  });
  const [tagStats, setTagStats] = useState<TagStats[]>([]);
  const [questionTypeStatsDisplay, setQuestionTypeStatsDisplay] = useState<QuestionTypeStatsDisplay[]>([]);

  useEffect(() => {
    loadStats();
    loadAdditionalStats();
  }, []);

  const loadStats = async () => {
    const statistics = await storage.getStatistics();
    setStats(statistics);

    // Use tag stats from getStatistics if available
    if (statistics.tagStats && statistics.tagStats.length > 0) {
      setTagStats(statistics.tagStats.map(t => ({
        ...t,
        questionCount: 0, // We don't have this from session_stats
      })));
    }
  };

  const loadAdditionalStats = async () => {
    // Load spaced repetition stats
    const questions = await storage.getQuestions();
    const reviewStats = getReviewStats(questions);
    setSRStats(reviewStats);

    // Calculate tag stats from questions only as fallback (if not already set from getStatistics)
    // This is mainly for counting questionCount per tag
    const tagMap = new Map<string, { totalAnswered: number; totalCorrect: number; questionCount: number }>();
    questions.forEach((q: Question) => {
      const tags = q.tags || [];
      tags.forEach((tag: string) => {
        const existing = tagMap.get(tag) || { totalAnswered: 0, totalCorrect: 0, questionCount: 0 };
        existing.questionCount += 1;
        tagMap.set(tag, existing);
      });
    });

    // Merge question counts with existing tag stats
    setTagStats(prev => {
      if (prev.length === 0) {
        // No stats from getStatistics, use questions (but likely no answers recorded)
        return Array.from(tagMap.entries())
          .map(([tag, data]) => ({
            tag,
            totalAnswered: 0,
            totalCorrect: 0,
            averageScore: 0,
            questionCount: data.questionCount,
          }));
      }
      // Merge question counts into existing stats
      return prev.map(stat => ({
        ...stat,
        questionCount: tagMap.get(stat.tag)?.questionCount || 0,
      }));
    });

    // Calculate question type stats display
    const typeMap = new Map<string, { totalAnswered: number; totalCorrect: number; totalTime: number; questionCount: number }>();
    questions.forEach((q: Question) => {
      const type = q.questionType || "standard";
      const existing = typeMap.get(type) || { totalAnswered: 0, totalCorrect: 0, totalTime: 0, questionCount: 0 };
      existing.totalAnswered += q.timesAnswered || 0;
      existing.totalCorrect += q.timesCorrect || 0;
      existing.totalTime += (q.averageTimeSpent || 0) * (q.timesAnswered || 0);
      existing.questionCount += 1;
      typeMap.set(type, existing);
    });

    const typeLabels: Record<string, string> = {
      "standard": "Questions classiques",
      "double-series": "Double série",
    };

    const typeStatsArray: QuestionTypeStatsDisplay[] = Array.from(typeMap.entries())
      .map(([type, data]) => ({
        type,
        label: typeLabels[type] || type,
        totalAnswered: data.totalAnswered,
        totalCorrect: data.totalCorrect,
        averageScore: data.totalAnswered > 0 ? Math.round((data.totalCorrect / data.totalAnswered) * 100) : 0,
        averageTime: data.totalAnswered > 0 ? Math.round(data.totalTime / data.totalAnswered) : 0,
        questionCount: data.questionCount,
      }))
      .sort((a, b) => b.totalAnswered - a.totalAnswered);

    setQuestionTypeStatsDisplay(typeStatsArray);

    // Load daily challenge streak
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("daily-challenge-streak");
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setDailyStreak({
            current: data.current || 0,
            longest: data.longest || 0,
            totalDaysActive: data.totalDaysActive || 0,
          });
        } catch (e) {
          console.error("Error loading daily streak:", e);
        }
      }
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Target, label: "Sessions", value: stats.totalSessions, color: "text-blue-500", bg: "bg-blue-500/10" },
          { icon: Trophy, label: "Moyenne", value: `${stats.averageScore}%`, color: getScoreColor(stats.averageScore), bg: "bg-primary/10" },
          { icon: TrendingUp, label: "Meilleur", value: `${stats.bestScore}%`, color: "text-green-500", bg: "bg-green-500/10" },
          { icon: Clock, label: "Temps total", value: formatTime(stats.totalTimeSpent), color: "text-orange-500", bg: "bg-orange-500/10" }
        ].map((stat, index) => (
          <motion.div key={index} variants={item}>
            <Card className="border-white/5 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Streak Card */}
      {stats.streak && stats.streak.current > 0 && (
        <motion.div variants={item}>
          <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-xl">
                    <Flame className="h-8 w-8 text-orange-500 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-orange-500">{stats.streak.current} jours</p>
                    <p className="text-sm text-muted-foreground font-medium">Série en cours 🔥</p>
                  </div>
                </div>
                <div className="text-right bg-background/50 px-4 py-2 rounded-lg border border-white/5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Record</p>
                  <p className="text-xl font-bold">{stats.streak.longest} jours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Category Statistics */}
        <motion.div variants={item}>
          <Card className="h-full border-white/5 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Performance par catégorie</CardTitle>
              <CardDescription>
                Vos résultats détaillés pour chaque catégorie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {Object.keys(stats.categoryStats).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune donnée disponible
                  </p>
                ) : (
                  Object.entries(stats.categoryStats).map(([category, data]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{category}</span>
                        <span className={`font-bold ${getScoreColor(data.averageScore)}`}>
                          {data.averageScore}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex-1 bg-muted/50 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${data.averageScore}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-full rounded-full ${data.averageScore >= 80
                                ? "bg-green-500"
                                : data.averageScore >= 60
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                          />
                        </div>
                        <span className="w-24 text-right font-mono">
                          {data.totalCorrect}/{data.totalAnswered}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Difficulty Statistics */}
        <motion.div variants={item}>
          <Card className="h-full border-white/5 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Performance par difficulté</CardTitle>
              <CardDescription>
                Vos résultats selon le niveau de difficulté
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {Object.entries(stats.difficultyStats).map(([difficulty, data]) => {
                  if (data.totalAnswered === 0) return null;

                  const difficultyLabels = {
                    easy: "Facile",
                    medium: "Moyen",
                    hard: "Difficile",
                  };

                  return (
                    <div key={difficulty} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {difficultyLabels[difficulty as keyof typeof difficultyLabels]}
                        </span>
                        <span className={`font-bold ${getScoreColor(data.averageScore)}`}>
                          {data.averageScore}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex-1 bg-muted/50 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${data.averageScore}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-full rounded-full ${data.averageScore >= 80
                                ? "bg-green-500"
                                : data.averageScore >= 60
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                          />
                        </div>
                        <span className="w-24 text-right font-mono">
                          {data.totalCorrect}/{data.totalAnswered}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Question Type and Tag Statistics */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Question Type Statistics */}
        <motion.div variants={item}>
          <Card className="h-full border-white/5 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-500" />
                Performance par type
              </CardTitle>
              <CardDescription>
                Vos résultats selon le type de question
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {questionTypeStatsDisplay.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune donnée disponible
                  </p>
                ) : (
                  questionTypeStatsDisplay.map((typeData) => (
                    <div key={typeData.type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{typeData.label}</span>
                          <span className="text-xs text-muted-foreground">
                            ({typeData.questionCount} questions)
                          </span>
                        </div>
                        <span className={`font-bold ${getScoreColor(typeData.averageScore)}`}>
                          {typeData.averageScore}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex-1 bg-muted/50 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${typeData.averageScore}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-full rounded-full ${
                              typeData.averageScore >= 80
                                ? "bg-green-500"
                                : typeData.averageScore >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                          />
                        </div>
                        <span className="w-24 text-right font-mono">
                          {typeData.totalCorrect}/{typeData.totalAnswered}
                        </span>
                      </div>
                      {typeData.averageTime > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Temps moyen: {typeData.averageTime}s</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tag Statistics */}
        <motion.div variants={item}>
          <Card className="h-full border-white/5 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-teal-500" />
                Performance par tag
              </CardTitle>
              <CardDescription>
                Vos résultats par thématique
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5 max-h-80 overflow-y-auto pr-2">
                {tagStats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucun tag avec des réponses
                  </p>
                ) : (
                  tagStats.map((tagData) => (
                    <div key={tagData.tag} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-500 text-xs font-medium">
                            {tagData.tag}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({tagData.questionCount} q.)
                          </span>
                        </div>
                        <span className={`font-bold ${getScoreColor(tagData.averageScore)}`}>
                          {tagData.averageScore}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex-1 bg-muted/50 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${tagData.averageScore}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-full rounded-full ${
                              tagData.averageScore >= 80
                                ? "bg-green-500"
                                : tagData.averageScore >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                          />
                        </div>
                        <span className="w-24 text-right font-mono">
                          {tagData.totalCorrect}/{tagData.totalAnswered}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Spaced Repetition Stats */}
      <motion.div variants={item}>
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Répétition Espacée
            </CardTitle>
            <CardDescription>
              Progression de votre apprentissage intelligent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-orange-500">{srStats.dueToday}</p>
                <p className="text-xs text-muted-foreground">À réviser</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="flex items-center justify-center mb-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-blue-500">{srStats.newQuestions}</p>
                <p className="text-xs text-muted-foreground">Nouvelles</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="flex items-center justify-center mb-2">
                  <GraduationCap className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-500">{srStats.mastered}</p>
                <p className="text-xs text-muted-foreground">Maîtrisées</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="flex items-center justify-center mb-2">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-purple-500">{srStats.averageMastery}%</p>
                <p className="text-xs text-muted-foreground">Maîtrise moy.</p>
              </div>
            </div>

            {/* Mastery progress bar */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Niveau de maîtrise global</span>
                <span className={`font-bold ${
                  srStats.averageMastery >= 80 ? "text-green-500" :
                  srStats.averageMastery >= 50 ? "text-yellow-500" :
                  "text-orange-500"
                }`}>{srStats.averageMastery}%</span>
              </div>
              <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${srStats.averageMastery}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className={`h-full rounded-full ${
                    srStats.averageMastery >= 80 ? "bg-green-500" :
                    srStats.averageMastery >= 50 ? "bg-yellow-500" :
                    "bg-orange-500"
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Daily Challenge Stats */}
      {(dailyStreak.current > 0 || dailyStreak.totalDaysActive > 0) && (
        <motion.div variants={item}>
          <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                Défis Quotidiens
              </CardTitle>
              <CardDescription>
                Votre progression dans les défis quotidiens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <div className="flex items-center justify-center mb-2">
                    <Flame className="h-6 w-6 text-orange-500" />
                  </div>
                  <p className="text-3xl font-bold text-orange-500">{dailyStreak.current}</p>
                  <p className="text-xs text-muted-foreground">Série actuelle</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <div className="flex items-center justify-center mb-2">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                  </div>
                  <p className="text-3xl font-bold text-yellow-500">{dailyStreak.longest}</p>
                  <p className="text-xs text-muted-foreground">Record</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-blue-500">{dailyStreak.totalDaysActive}</p>
                  <p className="text-xs text-muted-foreground">Jours actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Sessions */}
      <motion.div variants={item}>
        <Card className="border-white/5 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Dernières sessions
            </CardTitle>
            <CardDescription>
              Historique de vos {stats.recentSessions.length} dernières sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentSessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune session complétée
                </p>
              ) : (
                stats.recentSessions.map((session, idx) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-background/30 hover:bg-background/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className={`text-xl font-bold ${getScoreColor(session.score || 0)}`}>
                          {session.score}%
                        </span>
                        <div className="h-4 w-px bg-border/50" />
                        <span className="text-sm text-muted-foreground">
                          {session.totalQuestions || session.questions.length} questions
                        </span>
                        {session.mode && (
                          <>
                            <div className="h-4 w-px bg-border/50" />
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              session.mode === "sprint" ? "bg-yellow-500/10 text-yellow-500" :
                              session.mode === "daily-challenge" ? "bg-orange-500/10 text-orange-500" :
                              session.mode === "exam" ? "bg-red-500/10 text-red-500" :
                              "bg-primary/10 text-primary"
                            }`}>
                              {session.mode === "sprint" ? "Sprint" :
                               session.mode === "daily-challenge" ? "Défi" :
                               session.mode === "exam" ? "Examen" :
                               session.mode === "review" ? "Révision" : "Pratique"}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(session.completedAt!).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {session.totalTime && (
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(session.totalTime)}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
