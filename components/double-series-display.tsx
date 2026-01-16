"use client";

import { DoubleSeriesData } from "@/lib/types";

interface DoubleSeriesDisplayProps {
  data: DoubleSeriesData;
}

export function DoubleSeriesDisplay({ data }: DoubleSeriesDisplayProps) {
  const { horizontalSeries, verticalSeries, horizontalLabel, verticalLabel } = data;

  // Trouver les indices des valeurs inconnues (le "?" dans chaque série)
  const horizontalQuestionIndex = horizontalSeries.findIndex(el => el === "?" || el === "");
  const verticalQuestionIndex = verticalSeries.findIndex(el => el === "?" || el === "");

  // Si aucun "?" trouvé, prendre le milieu par défaut
  const hIndex = horizontalQuestionIndex >= 0 ? horizontalQuestionIndex : Math.floor(horizontalSeries.length / 2);
  const vIndex = verticalQuestionIndex >= 0 ? verticalQuestionIndex : Math.floor(verticalSeries.length / 2);

  // Éléments de la série verticale (sans le "?" qui sera à l'intersection)
  const verticalTop = verticalSeries.slice(0, vIndex);
  const verticalBottom = verticalSeries.slice(vIndex + 1);

  // Éléments de la série horizontale (sans le "?" qui sera à l'intersection)
  const horizontalLeft = horizontalSeries.slice(0, hIndex);
  const horizontalRight = horizontalSeries.slice(hIndex + 1);

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

      {/* Conteneur scrollable et centré pour mobile */}
      <div className="overflow-x-auto pb-2">
        <div className="flex justify-center min-w-fit px-2">
          {/* Structure en croix */}
          <div className="flex flex-col items-center">
            {/* Série verticale SUPÉRIEURE */}
            {verticalTop.map((element, index) => (
              <div
                key={`vert-top-${index}`}
                className={`
                  w-12 sm:w-16 h-10 sm:h-12
                  flex items-center justify-center
                  font-mono text-sm sm:text-lg font-bold
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

            {/* LIGNE HORIZONTALE avec l'intersection au centre */}
            <div className="flex items-center">
              {/* Partie gauche de la série horizontale */}
              {horizontalLeft.map((element, index) => (
                <div
                  key={`horiz-left-${index}`}
                  className={`
                    w-12 sm:w-16 h-10 sm:h-12
                    flex items-center justify-center
                    font-mono text-sm sm:text-lg font-bold
                    border-t-2 border-b-2 border-l-2 border-gray-300 dark:border-gray-600
                    ${index === 0 ? "rounded-l-lg" : ""}
                    ${
                      element === "?" || element === ""
                        ? "bg-blue-500 dark:bg-blue-600 text-white animate-pulse"
                        : "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                    }
                  `}
                >
                  {element || "?"}
                </div>
              ))}

              {/* INTERSECTION - Le "?" commun aux deux séries */}
              <div
                className={`
                  w-12 sm:w-16 h-10 sm:h-12
                  flex items-center justify-center
                  font-mono text-sm sm:text-lg font-bold
                  border-2 border-yellow-400 dark:border-yellow-500
                  bg-gradient-to-br from-blue-500 to-green-500 dark:from-blue-600 dark:to-green-600
                  text-white animate-pulse
                  ${horizontalLeft.length === 0 ? "rounded-l-lg" : ""}
                  ${horizontalRight.length === 0 ? "rounded-r-lg" : ""}
                  ${verticalTop.length === 0 ? "rounded-t-lg" : ""}
                  ${verticalBottom.length === 0 ? "rounded-b-lg" : ""}
                  ring-2 ring-yellow-400 dark:ring-yellow-500 ring-offset-1 ring-offset-background
                `}
              >
                ?
              </div>

              {/* Partie droite de la série horizontale */}
              {horizontalRight.map((element, index) => (
                <div
                  key={`horiz-right-${index}`}
                  className={`
                    w-12 sm:w-16 h-10 sm:h-12
                    flex items-center justify-center
                    font-mono text-sm sm:text-lg font-bold
                    border-t-2 border-b-2 border-r-2 border-gray-300 dark:border-gray-600
                    ${index === horizontalRight.length - 1 ? "rounded-r-lg" : ""}
                    ${
                      element === "?" || element === ""
                        ? "bg-blue-500 dark:bg-blue-600 text-white animate-pulse"
                        : "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                    }
                  `}
                >
                  {element || "?"}
                </div>
              ))}
            </div>

            {/* Série verticale INFÉRIEURE */}
            {verticalBottom.map((element, index) => (
              <div
                key={`vert-bottom-${index}`}
                className={`
                  w-12 sm:w-16 h-10 sm:h-12
                  flex items-center justify-center
                  font-mono text-sm sm:text-lg font-bold
                  border-l-2 border-r-2 border-b-2 border-gray-300 dark:border-gray-600
                  ${index === verticalBottom.length - 1 ? "rounded-b-lg" : ""}
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
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 sm:mt-6 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-2 sm:p-3 mx-2">
        <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-100 text-center">
          <span className="font-semibold">Instructions :</span> Trouvez la valeur qui satisfait les deux séries à l&apos;intersection
        </p>
      </div>
    </div>
  );
}
