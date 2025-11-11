"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { NotionBlockList } from "@/components/notion/notion-block";

interface PageContent {
  page: any;
  blocks: any[];
}

export default function CorrectionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [content, setContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPageContent();
  }, [id]);

  async function loadPageContent() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/notion/pages/${id}`);
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setContent(data);
    } catch (err: any) {
      console.error("Error loading page content:", err);
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  // Extraire le titre de la question depuis les propriétés de la page
  function getQuestionTitle(): string {
    if (!content?.page) return "Correction";

    const properties = (content.page as any).properties;
    const titleProp = properties.Question || properties.Name || properties.title;

    if (titleProp?.title?.[0]?.plain_text) {
      return titleProp.title[0].plain_text;
    }

    return "Correction";
  }

  // Extraire les métadonnées
  function getMetadata() {
    if (!content?.page) return null;

    const properties = (content.page as any).properties;

    const categoryProp = properties.Catégorie || properties.Category;
    const category = categoryProp?.select?.name;

    const difficultyProp = properties.Difficulté || properties.Difficulty;
    const difficulty = difficultyProp?.select?.name;

    const tagsProp = properties.Tags;
    const tags = tagsProp?.multi_select?.map((tag: any) => tag.name) || [];

    return { category, difficulty, tags };
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Chargement de la correction...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <BookOpen className="w-16 h-16 mx-auto mb-2" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Erreur
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const metadata = getMetadata();
  const questionTitle = getQuestionTitle();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Correction détaillée
              </h1>
              {metadata && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {metadata.category && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                      {metadata.category}
                    </span>
                  )}
                  {metadata.difficulty && (
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        metadata.difficulty === "easy"
                          ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                          : metadata.difficulty === "medium"
                          ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                          : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                      }`}
                    >
                      {metadata.difficulty}
                    </span>
                  )}
                  {metadata.tags &&
                    metadata.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Question Title */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-3">
            <BookOpen className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Question
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {questionTitle}
              </p>
            </div>
          </div>
        </div>

        {/* Correction Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            📚 Correction complète
          </h2>

          {content?.blocks && content.blocks.length > 0 ? (
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <NotionBlockList blocks={content.blocks} />
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">
                Aucun contenu de correction disponible pour cette question.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            Retour aux questions
          </button>
        </div>
      </main>
    </div>
  );
}
