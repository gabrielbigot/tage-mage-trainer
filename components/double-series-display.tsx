"use client";

import { DoubleSeriesData } from "@/lib/types";

interface DoubleSeriesDisplayProps {
  data: DoubleSeriesData;
}

export function DoubleSeriesDisplay({ data }: DoubleSeriesDisplayProps) {
  const { horizontalSeries, verticalSeries, horizontalLabel, verticalLabel } = data;

  // Trouver les indices des valeurs inconnues
  const horizontalQuestionIndex = horizontalSeries.findIndex(el => el === "?" || el === "");
  const verticalQuestionIndex = verticalSeries.findIndex(el => el === "?" || el === "");

  return (
    <div className="my-6">
      {/* Labels des séries */}
      <div className="mb-4 space-y-1">
        {horizontalLabel && (
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            ➡️ {horizontalLabel}
          </p>
        )}
        {verticalLabel && (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            ⬇️ {verticalLabel}
          </p>
        )}
      </div>

      {/* Matrice en croix */}
      <div className="flex flex-col items-center gap-0">
        {/* Série verticale supérieure */}
        {verticalSeries.slice(0, verticalQuestionIndex).map((element, index) => (
          <div
            key={`vert-top-${index}`}
            className={`
              px-6 py-3 font-mono text-xl font-bold text-center min-w-[80px]
              border-l-2 border-r-2 border-t-2 border-gray-300 dark:border-gray-600
              ${index === 0 ? "rounded-t-lg" : ""}
              ${
                element === "?" || element === ""
                  ? "bg-green-500 dark:bg-green-600 text-white animate-pulse"
                  : "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100"
              }
            `}
          >
            {element || "?"}
          </div>
        ))}

        {/* Série horizontale avec intersection */}
        <div className="flex items-center gap-0">
          {horizontalSeries.map((horizElement, horizIndex) => {
            const isIntersection = horizIndex === horizontalQuestionIndex;

            return (
              <div
                key={`horiz-${horizIndex}`}
                className={`
                  px-6 py-3 font-mono text-xl font-bold text-center min-w-[80px]
                  border-t-2 border-b-2 border-gray-300 dark:border-gray-600
                  ${horizIndex === 0 ? "border-l-2 rounded-l-lg" : ""}
                  ${horizIndex === horizontalSeries.length - 1 ? "border-r-2 rounded-r-lg" : ""}
                  ${
                    isIntersection
                      ? "bg-gradient-to-br from-blue-500 to-green-500 dark:from-blue-600 dark:to-green-600 text-white border-4 border-yellow-400 dark:border-yellow-500 animate-pulse"
                      : horizElement === "?" || horizElement === ""
                      ? "bg-blue-500 dark:bg-blue-600 text-white animate-pulse"
                      : "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                  }
                `}
              >
                {horizElement || "?"}
              </div>
            );
          })}
        </div>

        {/* Série verticale inférieure */}
        {verticalSeries.slice(verticalQuestionIndex + 1).map((element, index) => (
          <div
            key={`vert-bottom-${index}`}
            className={`
              px-6 py-3 font-mono text-xl font-bold text-center min-w-[80px]
              border-l-2 border-r-2 border-b-2 border-gray-300 dark:border-gray-600
              ${index === verticalSeries.length - verticalQuestionIndex - 2 ? "rounded-b-lg" : ""}
              ${
                element === "?" || element === ""
                  ? "bg-green-500 dark:bg-green-600 text-white animate-pulse"
                  : "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100"
              }
            `}
          >
            {element || "?"}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
        <p className="text-sm text-amber-900 dark:text-amber-100 text-center">
          <span className="font-semibold">Instructions :</span> Trouvez les deux valeurs manquantes qui se croisent
        </p>
      </div>
    </div>
  );
}
