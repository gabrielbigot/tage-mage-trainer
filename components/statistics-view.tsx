"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { storage } from "@/lib/storage";
import { Statistics } from "@/lib/types";
import { Trophy, Target, Clock, TrendingUp, Flame, Calendar } from "lucide-react";

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
      <div className="text-center py-8">
        <p className="text-muted-foreground">Chargement des statistiques...</p>
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
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
                  {stats.averageScore}%
                </p>
                <p className="text-xs text-muted-foreground">Moyenne</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.bestScore}%</p>
                <p className="text-xs text-muted-foreground">Meilleur</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatTime(stats.totalTimeSpent)}</p>
                <p className="text-xs text-muted-foreground">Temps total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streak Card */}
      {stats.streak && stats.streak.current > 0 && (
        <Card className="border-orange-200 dark:border-orange-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Flame className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.streak.current} jours</p>
                  <p className="text-sm text-muted-foreground">Série en cours 🔥</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Record</p>
                <p className="text-xl font-bold">{stats.streak.longest} jours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance par catégorie</CardTitle>
          <CardDescription>
            Vos résultats détaillés pour chaque catégorie de questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.keys(stats.categoryStats).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          data.averageScore >= 80
                            ? "bg-green-600"
                            : data.averageScore >= 60
                            ? "bg-yellow-600"
                            : "bg-red-600"
                        }`}
                        style={{ width: `${data.averageScore}%` }}
                      />
                    </div>
                    <span className="w-32 text-right">
                      {data.totalCorrect} / {data.totalAnswered} réponses
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance par difficulté</CardTitle>
          <CardDescription>
            Vos résultats selon le niveau de difficulté
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          data.averageScore >= 80
                            ? "bg-green-600"
                            : data.averageScore >= 60
                            ? "bg-yellow-600"
                            : "bg-red-600"
                        }`}
                        style={{ width: `${data.averageScore}%` }}
                      />
                    </div>
                    <span className="w-32 text-right">
                      {data.totalCorrect} / {data.totalAnswered} réponses
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Dernières sessions
          </CardTitle>
          <CardDescription>
            Historique de vos {stats.recentSessions.length} dernières sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentSessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucune session complétée
              </p>
            ) : (
              stats.recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${getScoreColor(session.score || 0)}`}>
                        {session.score}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {session.questions.length} questions
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
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
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(session.totalTime)}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
