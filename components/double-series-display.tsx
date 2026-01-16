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

  // Si aucun "?" trouvé, prendre le milieu par défaut
  const hIndex = horizontalQuestionIndex >= 0 ? horizontalQuestionIndex : Math.floor(horizontalSeries.length / 2);
  const vIndex = verticalQuestionIndex >= 0 ? verticalQuestionIndex : Math.floor(verticalSeries.length / 2);

  // Taille de cellule responsive (en pixels)
  const cellSize = 56; // Taille de base pour mobile
  const cellSizeMd = 70; // Taille pour tablette/desktop

  return (
    <div className="my-4 sm:my-6">
      {/* Labels des séries */}
      <div className="mb-3 sm:mb-4 space-y-1 px-2">
        {horizontalLabel && (
          <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">
            ➡️ {horizontalLabel}
          </p>
        )}
        {verticalLabel && (
          <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">
            ⬇️ {verticalLabel}
          </p>
        )}
      </div>

      {/* Conteneur scrollable pour mobile */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col items-center min-w-full">
          {/* Wrapper centré */}
          <div className="flex flex-col items-start">
            {/* Série verticale supérieure - décalée à la position hIndex */}
            {verticalSeries.slice(0, vIndex).map((element, index) => (
              <div
                key={`vert-top-${index}`}
                className="flex"
                style={{
                  marginLeft: `calc(${hIndex} * var(--cell-size))`,
                }}
              >
                <div
                  className={`
                    cell-size
                    px-2 sm:px-4 py-2 sm:py-3 font-mono text-base sm:text-xl font-bold text-center
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
              </div>
            ))}

            {/* Série horizontale avec intersection */}
            <div className="flex items-center gap-0">
              {horizontalSeries.map((horizElement, horizIndex) => {
                const isIntersection = horizIndex === hIndex;

                return (
                  <div
                    key={`horiz-${horizIndex}`}
                    className={`
                      cell-size
                      px-2 sm:px-4 py-2 sm:py-3 font-mono text-base sm:text-xl font-bold text-center
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

            {/* Série verticale inférieure - décalée à la position hIndex */}
            {verticalSeries.slice(vIndex + 1).map((element, index) => (
              <div
                key={`vert-bottom-${index}`}
                className="flex"
                style={{
                  marginLeft: `calc(${hIndex} * var(--cell-size))`,
                }}
              >
                <div
                  className={`
                    cell-size
                    px-2 sm:px-4 py-2 sm:py-3 font-mono text-base sm:text-xl font-bold text-center
                    border-l-2 border-r-2 border-b-2 border-gray-300 dark:border-gray-600
                    ${index === verticalSeries.length - vIndex - 2 ? "rounded-b-lg" : ""}
                    ${
                      element === "?" || element === ""
                        ? "bg-green-500 dark:bg-green-600 text-white animate-pulse"
                        : "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100"
                    }
                  `}
                >
                  {element || "?"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 sm:mt-6 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-2 sm:p-3 mx-2">
        <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-100 text-center">
          <span className="font-semibold">Instructions :</span> Trouvez les deux valeurs manquantes qui se croisent
        </p>
      </div>

      {/* CSS pour les tailles de cellules responsives */}
      <style jsx>{`
        .cell-size {
          --cell-size: ${cellSize}px;
          min-width: var(--cell-size);
          width: var(--cell-size);
        }
        @media (min-width: 640px) {
          .cell-size {
            --cell-size: ${cellSizeMd}px;
          }
        }
      `}</style>
    </div>
  );
}
