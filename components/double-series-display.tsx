"use client";

import { DoubleSeriesData } from "@/lib/types";

interface DoubleSeriesDisplayProps {
  data: DoubleSeriesData;
}

export function DoubleSeriesDisplay({ data }: DoubleSeriesDisplayProps) {
  const getMissingValue = (position: keyof Pick<DoubleSeriesData, 'top' | 'bottom' | 'left' | 'right' | 'center'>) => {
    return data.missingPosition === position ? "?" : data[position];
  };

  return (
    <div className="my-6">
      <div className="bg-primary/5 rounded-lg p-8 border-2 border-primary/20">
        <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
          {/* Top */}
          <div className="col-start-2 flex justify-center">
            <div className={`flex items-center justify-center w-20 h-20 rounded-lg border-2 font-mono text-2xl font-bold ${
              data.missingPosition === 'top'
                ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-500 text-yellow-700 dark:text-yellow-300'
                : 'bg-background border-border'
            }`}>
              {getMissingValue('top')}
            </div>
          </div>

          {/* Left, Center, Right */}
          <div className="flex justify-center">
            <div className={`flex items-center justify-center w-20 h-20 rounded-lg border-2 font-mono text-2xl font-bold ${
              data.missingPosition === 'left'
                ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-500 text-yellow-700 dark:text-yellow-300'
                : 'bg-background border-border'
            }`}>
              {getMissingValue('left')}
            </div>
          </div>

          <div className="flex justify-center">
            <div className={`flex items-center justify-center w-20 h-20 rounded-lg border-2 font-mono text-2xl font-bold ${
              data.missingPosition === 'center'
                ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-500 text-yellow-700 dark:text-yellow-300 ring-2 ring-yellow-400'
                : 'bg-primary/10 border-primary/50'
            }`}>
              {getMissingValue('center')}
            </div>
          </div>

          <div className="flex justify-center">
            <div className={`flex items-center justify-center w-20 h-20 rounded-lg border-2 font-mono text-2xl font-bold ${
              data.missingPosition === 'right'
                ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-500 text-yellow-700 dark:text-yellow-300'
                : 'bg-background border-border'
            }`}>
              {getMissingValue('right')}
            </div>
          </div>

          {/* Bottom */}
          <div className="col-start-2 flex justify-center">
            <div className={`flex items-center justify-center w-20 h-20 rounded-lg border-2 font-mono text-2xl font-bold ${
              data.missingPosition === 'bottom'
                ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-500 text-yellow-700 dark:text-yellow-300'
                : 'bg-background border-border'
            }`}>
              {getMissingValue('bottom')}
            </div>
          </div>
        </div>

        {(data.horizontalLogic || data.verticalLogic) && (
          <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
            {data.horizontalLogic && (
              <div className="text-sm">
                <span className="font-semibold">Logique horizontale :</span>
                <p className="text-muted-foreground mt-1">{data.horizontalLogic}</p>
              </div>
            )}
            {data.verticalLogic && (
              <div className="text-sm">
                <span className="font-semibold">Logique verticale :</span>
                <p className="text-muted-foreground mt-1">{data.verticalLogic}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
