"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { storage } from "@/lib/storage";
import { Statistics } from "@/lib/types";
import { Trophy, Target, Clock, TrendingUp, Flame, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export function StatisticsView() {
  const [stats, setStats] = useState<Statistics | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const statistics = await storage.getStatistics();
    setStats(statistics);
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
                          {session.questions.length} questions
                        </span>
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
