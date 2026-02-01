"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConditionsMinimalesData } from "@/lib/types";
import { ConditionsMinimalesDisplay } from "@/components/conditions-minimales-display";

interface ConditionsMinimalesFormProps {
  value: ConditionsMinimalesData;
  onChange: (data: ConditionsMinimalesData) => void;
}

export function ConditionsMinimalesForm({ value, onChange }: ConditionsMinimalesFormProps) {
  const handleCondition1Change = (condition1: string) => {
    onChange({ ...value, condition1 });
  };

  const handleCondition2Change = (condition2: string) => {
    onChange({ ...value, condition2 });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <h3 className="font-medium text-lg">Conditions minimales</h3>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="condition1" className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            Condition 1
          </Label>
          <Textarea
            id="condition1"
            value={value.condition1}
            onChange={(e) => handleCondition1Change(e.target.value)}
            placeholder="Ex: x + y = 10"
            className="min-h-[60px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="condition2" className="flex items-center gap-2">
            <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
            Condition 2
          </Label>
          <Textarea
            id="condition2"
            value={value.condition2}
            onChange={(e) => handleCondition2Change(e.target.value)}
            placeholder="Ex: x - y = 2"
            className="min-h-[60px]"
          />
        </div>
      </div>

      {/* Preview */}
      {(value.condition1 || value.condition2) && (
        <div className="mt-4">
          <Label className="text-sm text-muted-foreground">Apercu</Label>
          <ConditionsMinimalesDisplay data={value} />
        </div>
      )}

      {/* Default answers hint */}
      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-100">
          <span className="font-semibold">Rappel des reponses standard :</span>
        </p>
        <ul className="text-xs text-amber-800 dark:text-amber-200 mt-1 space-y-0.5 list-disc list-inside">
          <li>La condition (1) seule permet de repondre</li>
          <li>La condition (2) seule permet de repondre</li>
          <li>Les deux conditions ensemble sont necessaires</li>
          <li>Chaque condition permet de repondre separement</li>
          <li>Les deux conditions ne suffisent pas</li>
        </ul>
      </div>
    </div>
  );
}
