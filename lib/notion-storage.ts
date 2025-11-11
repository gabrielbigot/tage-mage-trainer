import { notion, NOTION_DATABASE_ID } from "./notion/client";
import { Question, TrainingSession, QuestionResult, Statistics, DifficultyLevel, SessionMode } from "./types";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

/**
 * Adaptateur de stockage pour Notion
 *
 * Structure de la base de données Notion :
 * - Titre : Question (title)
 * - Catégorie : Select (Logique, Calcul, Expression, Conditions Minimales)
 * - Tags : Multi-select (arithmétique, pgcd, algèbre, etc.)
 * - Difficulté : Select (easy, medium, hard)
 * - Favoris : Checkbox
 *
 * Contenu de la page :
 * - Liste de tâches (to_do) avec les options de réponse
 * - La tâche cochée correspond à la bonne réponse
 * - Paragraphe(s) avec l'explication/correction
 */

// Cache local pour les sessions en cours (Notion n'est pas optimal pour ça)
const localSessions: Map<string, TrainingSession> = new Map();
const localStats = {
  sessions: [] as TrainingSession[],
  questionStats: new Map<string, { correct: number; incorrect: number; totalTime: number; count: number }>(),
};

/**
 * Convertit une page Notion en Question
 */
function notionPageToQuestion(page: PageObjectResponse): Question | null {
  try {
    const properties = page.properties as any;

    // Extraire le titre (question)
    const titleProp = properties.Question || properties.Name || properties.title;
    const title = titleProp?.title?.[0]?.plain_text || "";

    // Extraire la catégorie
    const categoryProp = properties.Catégorie || properties.Category;
    const category = categoryProp?.select?.name || "Autre";

    // Extraire les tags
    const tagsProp = properties.Tags;
    const tags = tagsProp?.multi_select?.map((tag: any) => tag.name) || [];

    // Extraire la difficulté
    const difficultyProp = properties.Difficulté || properties.Difficulty;
    const difficulty = difficultyProp?.select?.name?.toLowerCase() as DifficultyLevel | undefined;

    // Extraire le statut favori
    const favorisProp = properties.Favoris || properties.Favorite;
    const isFavorite = favorisProp?.checkbox || false;

    return {
      id: page.id,
      category,
      question: title,
      options: [], // Sera rempli lors de la lecture du contenu
      correctAnswer: 0, // Sera rempli lors de la lecture du contenu
      explanation: "", // Sera rempli lors de la lecture du contenu
      createdAt: new Date(page.created_time).getTime(),
      difficulty,
      tags: tags.length > 0 ? tags : undefined,
      isFavorite,
    };
  } catch (error) {
    console.error("Error converting Notion page to Question:", error);
    return null;
  }
}

/**
 * Récupère le contenu d'une page Notion (options et explication)
 */
async function getPageContent(pageId: string): Promise<{ options: string[]; correctAnswer: number; explanation: string }> {
  try {
    const response = await notion.blocks.children.list({
      block_id: pageId,
    });

    const blocks = response.results as any[];

    // Extraire les options (to_do blocks)
    const options: string[] = [];
    let correctAnswer = 0;

    // Extraire l'explication (paragraphes après les to_do)
    let explanation = "";
    let foundTodos = false;
    let afterTodos = false;

    for (const block of blocks) {
      if (block.type === "to_do") {
        foundTodos = true;
        const text = block.to_do.rich_text?.[0]?.plain_text || "";
        options.push(text);

        if (block.to_do.checked) {
          correctAnswer = options.length - 1;
        }
      } else if (foundTodos && (block.type === "paragraph" || block.type === "heading_2" || block.type === "heading_3")) {
        afterTodos = true;
        const content = block.type === "paragraph"
          ? block.paragraph?.rich_text
          : block.type === "heading_2"
          ? block.heading_2?.rich_text
          : block.heading_3?.rich_text;

        const text = content?.map((t: any) => t.plain_text).join("") || "";
        if (text.trim()) {
          explanation += (explanation ? "\n" : "") + text;
        }
      } else if (block.type === "bulleted_list_item" && afterTodos) {
        const text = block.bulleted_list_item?.rich_text?.map((t: any) => t.plain_text).join("") || "";
        if (text.trim()) {
          explanation += "\n• " + text;
        }
      } else if (block.type === "numbered_list_item" && afterTodos) {
        const text = block.numbered_list_item?.rich_text?.map((t: any) => t.plain_text).join("") || "";
        if (text.trim()) {
          explanation += "\n" + text;
        }
      }
    }

    return {
      options,
      correctAnswer,
      explanation: explanation.trim(),
    };
  } catch (error) {
    console.error("Error fetching page content:", error);
    return { options: [], correctAnswer: 0, explanation: "" };
  }
}

/**
 * Récupère les questions complètes avec leur contenu
 */
async function getQuestionsWithContent(pages: PageObjectResponse[]): Promise<Question[]> {
  const questions: Question[] = [];

  for (const page of pages) {
    const question = notionPageToQuestion(page);
    if (!question) continue;

    // Récupérer le contenu de la page
    const content = await getPageContent(page.id);
    question.options = content.options;
    question.correctAnswer = content.correctAnswer;
    question.explanation = content.explanation;

    // Ajouter les stats locales si disponibles
    const stats = localStats.questionStats.get(question.id);
    if (stats) {
      question.timesAnswered = stats.count;
      question.timesCorrect = stats.correct;
      question.timesIncorrect = stats.incorrect;
      question.averageTimeSpent = stats.count > 0 ? stats.totalTime / stats.count : undefined;
    }

    questions.push(question);
  }

  return questions;
}

export const notionStorage = {
  // Questions
  async getQuestions(): Promise<Question[]> {
    try {
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        sorts: [
          {
            timestamp: "created_time",
            direction: "descending",
          },
        ],
      });

      const pages = response.results as PageObjectResponse[];
      return await getQuestionsWithContent(pages);
    } catch (error) {
      console.error("Error fetching questions from Notion:", error);
      return [];
    }
  },

  async addQuestion(question: Omit<Question, "id" | "createdAt">): Promise<Question | null> {
    try {
      // Créer la page avec les propriétés
      const response = await notion.pages.create({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          Question: {
            title: [
              {
                text: {
                  content: question.question,
                },
              },
            ],
          },
          Catégorie: {
            select: {
              name: question.category,
            },
          },
          Tags: {
            multi_select: (question.tags || []).map(tag => ({ name: tag })),
          },
          Difficulté: question.difficulty
            ? {
                select: {
                  name: question.difficulty,
                },
              }
            : undefined,
          Favoris: {
            checkbox: question.isFavorite || false,
          },
        } as any,
      });

      const pageId = response.id;

      // Ajouter le contenu (options + explication)
      const children: any[] = [];

      // Ajouter les options en tant que to_do
      question.options.forEach((option, index) => {
        children.push({
          type: "to_do",
          to_do: {
            rich_text: [
              {
                text: {
                  content: option,
                },
              },
            ],
            checked: index === question.correctAnswer,
          },
        });
      });

      // Ajouter un saut de ligne
      children.push({
        type: "paragraph",
        paragraph: {
          rich_text: [],
        },
      });

      // Ajouter l'explication
      if (question.explanation) {
        children.push({
          type: "heading_3",
          heading_3: {
            rich_text: [
              {
                text: {
                  content: "Explication",
                },
              },
            ],
          },
        });

        children.push({
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                text: {
                  content: question.explanation,
                },
              },
            ],
          },
        });
      }

      await notion.blocks.children.append({
        block_id: pageId,
        children,
      });

      // Retourner la question créée
      return {
        id: pageId,
        ...question,
        createdAt: Date.now(),
      };
    } catch (error) {
      console.error("Error adding question to Notion:", error);
      return null;
    }
  },

  async updateQuestion(id: string, updates: Partial<Question>): Promise<void> {
    try {
      // Mettre à jour les propriétés
      const properties: any = {};

      if (updates.question) {
        properties.Question = {
          title: [{ text: { content: updates.question } }],
        };
      }

      if (updates.category) {
        properties.Catégorie = {
          select: { name: updates.category },
        };
      }

      if (updates.tags) {
        properties.Tags = {
          multi_select: updates.tags.map(tag => ({ name: tag })),
        };
      }

      if (updates.difficulty) {
        properties.Difficulté = {
          select: { name: updates.difficulty },
        };
      }

      if (updates.isFavorite !== undefined) {
        properties.Favoris = {
          checkbox: updates.isFavorite,
        };
      }

      if (Object.keys(properties).length > 0) {
        await notion.pages.update({
          page_id: id,
          properties,
        });
      }

      // Si les options ou l'explication changent, recréer le contenu
      if (updates.options || updates.explanation !== undefined || updates.correctAnswer !== undefined) {
        // Récupérer les blocs existants
        const response = await notion.blocks.children.list({
          block_id: id,
        });

        // Supprimer tous les blocs existants
        for (const block of response.results) {
          await notion.blocks.delete({
            block_id: (block as any).id,
          });
        }

        // Récupérer la question complète pour avoir toutes les infos
        const currentPage = await notion.pages.retrieve({ page_id: id }) as PageObjectResponse;
        const currentQuestion = notionPageToQuestion(currentPage);
        const currentContent = await getPageContent(id);

        const options = updates.options || currentContent.options;
        const correctAnswer = updates.correctAnswer !== undefined ? updates.correctAnswer : currentContent.correctAnswer;
        const explanation = updates.explanation !== undefined ? updates.explanation : currentContent.explanation;

        // Recréer le contenu
        const children: any[] = [];

        options.forEach((option, index) => {
          children.push({
            type: "to_do",
            to_do: {
              rich_text: [{ text: { content: option } }],
              checked: index === correctAnswer,
            },
          });
        });

        children.push({
          type: "paragraph",
          paragraph: { rich_text: [] },
        });

        if (explanation) {
          children.push({
            type: "heading_3",
            heading_3: {
              rich_text: [{ text: { content: "Explication" } }],
            },
          });

          children.push({
            type: "paragraph",
            paragraph: {
              rich_text: [{ text: { content: explanation } }],
            },
          });
        }

        await notion.blocks.children.append({
          block_id: id,
          children,
        });
      }
    } catch (error) {
      console.error("Error updating question in Notion:", error);
    }
  },

  async deleteQuestion(id: string): Promise<void> {
    try {
      await notion.pages.update({
        page_id: id,
        archived: true,
      });
    } catch (error) {
      console.error("Error deleting question from Notion:", error);
    }
  },

  async getQuestionsByCategory(category: string): Promise<Question[]> {
    try {
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        filter: {
          property: "Catégorie",
          select: {
            equals: category,
          },
        },
      });

      const pages = response.results as PageObjectResponse[];
      return await getQuestionsWithContent(pages);
    } catch (error) {
      console.error("Error fetching questions by category:", error);
      return [];
    }
  },

  async getRandomQuestions(count: number): Promise<Question[]> {
    const questions = await this.getQuestions();
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },

  async getQuestionsByDifficulty(difficulty: DifficultyLevel): Promise<Question[]> {
    try {
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        filter: {
          property: "Difficulté",
          select: {
            equals: difficulty,
          },
        },
      });

      const pages = response.results as PageObjectResponse[];
      return await getQuestionsWithContent(pages);
    } catch (error) {
      console.error("Error fetching questions by difficulty:", error);
      return [];
    }
  },

  async getFavoriteQuestions(): Promise<Question[]> {
    try {
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        filter: {
          property: "Favoris",
          checkbox: {
            equals: true,
          },
        },
      });

      const pages = response.results as PageObjectResponse[];
      return await getQuestionsWithContent(pages);
    } catch (error) {
      console.error("Error fetching favorite questions:", error);
      return [];
    }
  },

  async getQuestionsByTags(tags: string[]): Promise<Question[]> {
    try {
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        filter: {
          or: tags.map(tag => ({
            property: "Tags",
            multi_select: {
              contains: tag,
            },
          })),
        },
      });

      const pages = response.results as PageObjectResponse[];
      return await getQuestionsWithContent(pages);
    } catch (error) {
      console.error("Error fetching questions by tags:", error);
      return [];
    }
  },

  async toggleFavorite(id: string): Promise<void> {
    try {
      const page = await notion.pages.retrieve({ page_id: id }) as PageObjectResponse;
      const properties = page.properties as any;
      const currentFavorite = properties.Favoris?.checkbox || false;

      await notion.pages.update({
        page_id: id,
        properties: {
          Favoris: {
            checkbox: !currentFavorite,
          },
        },
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  },

  async getIncorrectQuestions(minErrors: number = 1): Promise<Question[]> {
    // Notion ne stocke pas les statistiques, on utilise le cache local
    const questions = await this.getQuestions();
    return questions.filter(q => (q.timesIncorrect || 0) >= minErrors)
      .sort((a, b) => (b.timesIncorrect || 0) - (a.timesIncorrect || 0));
  },

  // Image upload (non supporté par Notion directement, nécessiterait un autre service)
  async uploadImage(file: File): Promise<string | null> {
    console.warn("Image upload not implemented for Notion. Please upload images manually to Notion pages.");
    return null;
  },

  async deleteImage(imageUrl: string): Promise<void> {
    // Non applicable pour Notion
  },

  // Sessions (stockées localement car Notion n'est pas optimal pour ça)
  async createSession(questions: Question[], mode: SessionMode = "practice"): Promise<string> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session: TrainingSession = {
      id: sessionId,
      questions,
      currentIndex: 0,
      answers: new Array(questions.length).fill(null),
      startedAt: Date.now(),
      mode,
    };

    localSessions.set(sessionId, session);
    return sessionId;
  },

  async completeSession(
    sessionId: string,
    results: QuestionResult[],
    totalTime: number
  ): Promise<void> {
    const session = localSessions.get(sessionId);
    if (!session) return;

    const correctAnswers = results.filter(r => r.isCorrect).length;
    const score = Math.round((correctAnswers / results.length) * 100);

    session.completedAt = Date.now();
    session.score = score;
    session.totalTime = totalTime;
    session.results = results;

    // Mettre à jour les stats locales
    for (const result of results) {
      const stats = localStats.questionStats.get(result.questionId) || {
        correct: 0,
        incorrect: 0,
        totalTime: 0,
        count: 0,
      };

      stats.count++;
      if (result.isCorrect) {
        stats.correct++;
      } else {
        stats.incorrect++;
      }
      if (result.timeSpent) {
        stats.totalTime += result.timeSpent;
      }

      localStats.questionStats.set(result.questionId, stats);
    }

    localStats.sessions.push(session);
    localSessions.delete(sessionId);

    // Sauvegarder dans localStorage pour persistance
    if (typeof window !== "undefined") {
      localStorage.setItem("notion-stats", JSON.stringify({
        sessions: localStats.sessions,
        questionStats: Array.from(localStats.questionStats.entries()),
      }));
    }
  },

  async getStatistics(): Promise<Statistics> {
    // Charger les stats depuis localStorage si disponibles
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("notion-stats");
      if (saved) {
        const data = JSON.parse(saved);
        localStats.sessions = data.sessions || [];
        localStats.questionStats = new Map(data.questionStats || []);
      }
    }

    const questions = await this.getQuestions();
    const completedSessions = localStats.sessions.filter(s => s.completedAt);

    // Stats par catégorie
    const categoryStats: Record<string, { totalAnswered: number; totalCorrect: number; averageScore: number }> = {};
    questions.forEach(q => {
      if (!categoryStats[q.category]) {
        categoryStats[q.category] = { totalAnswered: 0, totalCorrect: 0, averageScore: 0 };
      }
      categoryStats[q.category].totalAnswered += q.timesAnswered || 0;
      categoryStats[q.category].totalCorrect += q.timesCorrect || 0;
    });

    Object.keys(categoryStats).forEach(cat => {
      categoryStats[cat].averageScore = categoryStats[cat].totalAnswered > 0
        ? Math.round((categoryStats[cat].totalCorrect / categoryStats[cat].totalAnswered) * 100)
        : 0;
    });

    // Stats par difficulté
    const difficultyStats: Record<DifficultyLevel, { totalAnswered: number; totalCorrect: number; averageScore: number }> = {
      easy: { totalAnswered: 0, totalCorrect: 0, averageScore: 0 },
      medium: { totalAnswered: 0, totalCorrect: 0, averageScore: 0 },
      hard: { totalAnswered: 0, totalCorrect: 0, averageScore: 0 },
    };

    questions.forEach(q => {
      const diff = q.difficulty || "medium";
      difficultyStats[diff].totalAnswered += q.timesAnswered || 0;
      difficultyStats[diff].totalCorrect += q.timesCorrect || 0;
    });

    Object.keys(difficultyStats).forEach(diff => {
      const d = diff as DifficultyLevel;
      difficultyStats[d].averageScore = difficultyStats[d].totalAnswered > 0
        ? Math.round((difficultyStats[d].totalCorrect / difficultyStats[d].totalAnswered) * 100)
        : 0;
    });

    const totalTimeSpent = completedSessions.reduce((sum, s) => sum + (s.totalTime || 0), 0);
    const averageScore = completedSessions.length > 0
      ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length)
      : 0;
    const bestScore = completedSessions.length > 0
      ? Math.max(...completedSessions.map(s => s.score || 0))
      : 0;

    return {
      totalQuestions: questions.length,
      totalSessions: completedSessions.length,
      totalTimeSpent,
      averageScore,
      bestScore,
      recentSessions: completedSessions.slice(-10),
      categoryStats,
      difficultyStats,
    };
  },

  async updateStreak(): Promise<void> {
    // Géré via localStorage
  },

  async getStreak(): Promise<{ current: number; longest: number; lastSessionDate?: string }> {
    if (typeof window === "undefined") {
      return { current: 0, longest: 0 };
    }

    const saved = localStorage.getItem("notion-streak");
    if (!saved) {
      return { current: 0, longest: 0 };
    }

    return JSON.parse(saved);
  },

  // Export/Import
  async exportData(): Promise<string> {
    const questions = await this.getQuestions();

    return JSON.stringify({
      questions,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  },

  async importData(jsonData: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = JSON.parse(jsonData);

      if (!data.questions || !Array.isArray(data.questions)) {
        return { success: false, message: "Format invalide : 'questions' manquant ou incorrect" };
      }

      let imported = 0;
      for (const q of data.questions) {
        try {
          await this.addQuestion({
            category: q.category,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            tags: q.tags,
            isFavorite: q.isFavorite,
          });
          imported++;
        } catch (error) {
          console.error("Error importing question:", error);
        }
      }

      return {
        success: true,
        message: `${imported} question(s) importée(s) dans Notion`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erreur lors de l'import : format JSON invalide",
      };
    }
  },
};
