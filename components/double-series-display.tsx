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

      {/* Matrice croisée */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="border-collapse">
            <thead>
              <tr>
                {/* Cellule vide en haut à gauche */}
                <th className="border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 p-2 w-20"></th>

                {/* Série horizontale (colonnes) */}
                {horizontalSeries.map((element, index) => (
                  <th
                    key={index}
                    className={`
                      border-2 border-gray-300 dark:border-gray-600 p-3 font-mono text-lg font-bold min-w-[60px]
                      ${
                        element === "?" || element === ""
                          ? "bg-blue-500 dark:bg-blue-600 text-white animate-pulse"
                          : "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                      }
                    `}
                  >
                    {element || "?"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Série verticale (lignes) */}
              {verticalSeries.map((vertElement, vertIndex) => (
                <tr key={vertIndex}>
                  {/* Cellule de la série verticale */}
                  <td
                    className={`
                      border-2 border-gray-300 dark:border-gray-600 p-3 font-mono text-lg font-bold text-center
                      ${
                        vertElement === "?" || vertElement === ""
                          ? "bg-green-500 dark:bg-green-600 text-white animate-pulse"
                          : "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100"
                      }
                    `}
                  >
                    {vertElement || "?"}
                  </td>

                  {/* Cellules de croisement */}
                  {horizontalSeries.map((horizElement, horizIndex) => {
                    const isIntersection =
                      (horizElement === "?" || horizElement === "") &&
                      (vertElement === "?" || vertElement === "");

                    return (
                      <td
                        key={horizIndex}
                        className={`
                          border-2 border-gray-300 dark:border-gray-600 p-3 text-center min-w-[60px]
                          ${
                            isIntersection
                              ? "bg-gradient-to-br from-blue-500 to-green-500 dark:from-blue-600 dark:to-green-600 animate-pulse"
                              : "bg-white dark:bg-gray-800"
                          }
                        `}
                      >
                        {isIntersection && (
                          <div className="flex items-center justify-center">
                            <span className="text-3xl font-bold text-white drop-shadow-lg">?</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
        <p className="text-sm text-amber-900 dark:text-amber-100 text-center">
          <span className="font-semibold">Instructions :</span> Trouvez les deux valeurs manquantes qui se croisent
        </p>
      </div>
    </div>
  );
}
