"use client";

import { ConditionsMinimalesData } from "@/lib/types";

interface ConditionsMinimalesDisplayProps {
  data: ConditionsMinimalesData;
}

export function ConditionsMinimalesDisplay({ data }: ConditionsMinimalesDisplayProps) {
  const { condition1, condition2 } = data;

  return (
    <div className="my-4 sm:my-6">
      {/* Conteneur des conditions */}
      <div className="space-y-3 sm:space-y-4">
        {/* Condition 1 */}
        <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500 dark:border-blue-400 rounded-r-lg p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-500 dark:bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              1
            </span>
            <p className="text-sm sm:text-base text-blue-900 dark:text-blue-100 pt-1">
              {condition1}
            </p>
          </div>
        </div>

        {/* Condition 2 */}
        <div className="bg-green-50 dark:bg-green-950 border-l-4 border-green-500 dark:border-green-400 rounded-r-lg p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-green-500 dark:bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              2
            </span>
            <p className="text-sm sm:text-base text-green-900 dark:text-green-100 pt-1">
              {condition2}
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 sm:mt-6 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-2 sm:p-3">
        <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-100 text-center">
          <span className="font-semibold">Instructions :</span> Déterminez si les conditions permettent de répondre à la question
        </p>
      </div>
    </div>
  );
}
