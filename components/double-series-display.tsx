"use client";

import { DoubleSeriesData } from "@/lib/types";
import { ArrowRight, ArrowDown } from "lucide-react";

interface DoubleSeriesDisplayProps {
  data: DoubleSeriesData;
}

export function DoubleSeriesDisplay({ data }: DoubleSeriesDisplayProps) {
  const { horizontalSeries, verticalSeries, horizontalLabel, verticalLabel } = data;

  return (
    <div className="space-y-6 my-6">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-4">
          <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            {horizontalLabel || "Série Horizontale"}
          </h3>
        </div>
        <div className="flex items-center justify-center gap-3">
          {horizontalSeries.map((element, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className={`
                  px-6 py-4 rounded-lg font-mono text-2xl font-bold
                  transition-all duration-200 hover:scale-105
                  ${
                    element === "?" || element === ""
                      ? "bg-blue-600 dark:bg-blue-500 text-white shadow-lg animate-pulse"
                      : "bg-white dark:bg-blue-950 text-blue-900 dark:text-blue-100 border-2 border-blue-300 dark:border-blue-700"
                  }
                `}
              >
                {element || "?"}
              </div>
              {index < horizontalSeries.length - 1 && (
                <span className="text-blue-400 dark:text-blue-600 text-xl font-bold">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2 mb-4">
          <ArrowDown className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h3 className="text-sm font-semibold text-green-900 dark:text-green-100">
            {verticalLabel || "Série Verticale"}
          </h3>
        </div>
        <div className="flex items-center justify-center gap-3">
          {verticalSeries.map((element, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className={`
                  px-6 py-4 rounded-lg font-mono text-2xl font-bold
                  transition-all duration-200 hover:scale-105
                  ${
                    element === "?" || element === ""
                      ? "bg-green-600 dark:bg-green-500 text-white shadow-lg animate-pulse"
                      : "bg-white dark:bg-green-950 text-green-900 dark:text-green-100 border-2 border-green-300 dark:border-green-700"
                  }
                `}
              >
                {element || "?"}
              </div>
              {index < verticalSeries.length - 1 && (
                <span className="text-green-400 dark:text-green-600 text-xl font-bold">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-900 dark:text-amber-100 text-center">
          <span className="font-semibold">Instructions :</span> Trouvez les deux valeurs manquantes (une dans chaque série)
        </p>
      </div>
    </div>
  );
}
