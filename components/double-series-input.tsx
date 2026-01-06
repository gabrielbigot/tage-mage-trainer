"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DoubleSeriesData } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";

interface DoubleSeriesInputProps {
  data: DoubleSeriesData;
  onChange: (data: DoubleSeriesData) => void;
  disabled?: boolean;
}

export function DoubleSeriesInput({ data, onChange, disabled }: DoubleSeriesInputProps) {
  const handlePositionChange = (position: keyof DoubleSeriesData, value: string) => {
    onChange({ ...data, [position]: value });
  };

  const handleMissingPositionChange = (position: DoubleSeriesData["missingPosition"]) => {
    onChange({ ...data, missingPosition: position });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Structure en croix</Label>
        <p className="text-sm text-muted-foreground">
          Saisissez les valeurs alphanumériques pour chaque position de la croix
        </p>
      </div>

      {/* Visual cross layout */}
      <div className="relative bg-muted/30 rounded-lg p-8">
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          {/* Top row */}
          <div className="col-start-2">
            <div className="relative">
              <Input
                value={data.top}
                onChange={(e) => handlePositionChange("top", e.target.value)}
                placeholder="Ex: B4"
                className="text-center font-mono text-lg"
                disabled={disabled}
              />
              <input
                type="radio"
                name="missingPosition"
                checked={data.missingPosition === "top"}
                onChange={() => handleMissingPositionChange("top")}
                className="absolute -top-2 -right-2 w-4 h-4"
                disabled={disabled}
                title="Position à trouver"
              />
            </div>
          </div>

          {/* Middle row with left, center, right */}
          <div className="relative">
            <Input
              value={data.left}
              onChange={(e) => handlePositionChange("left", e.target.value)}
              placeholder="Ex: A1"
              className="text-center font-mono text-lg"
              disabled={disabled}
            />
            <input
              type="radio"
              name="missingPosition"
              checked={data.missingPosition === "left"}
              onChange={() => handleMissingPositionChange("left")}
              className="absolute -top-2 -right-2 w-4 h-4"
              disabled={disabled}
              title="Position à trouver"
            />
          </div>

          <div className="relative">
            <Input
              value={data.center}
              onChange={(e) => handlePositionChange("center", e.target.value)}
              placeholder="Ex: B5 ou ?"
              className="text-center font-mono text-lg bg-primary/5 border-primary/30"
              disabled={disabled}
            />
            <input
              type="radio"
              name="missingPosition"
              checked={data.missingPosition === "center"}
              onChange={() => handleMissingPositionChange("center")}
              className="absolute -top-2 -right-2 w-4 h-4"
              disabled={disabled}
              title="Position à trouver"
            />
          </div>

          <div className="relative">
            <Input
              value={data.right}
              onChange={(e) => handlePositionChange("right", e.target.value)}
              placeholder="Ex: C9"
              className="text-center font-mono text-lg"
              disabled={disabled}
            />
            <input
              type="radio"
              name="missingPosition"
              checked={data.missingPosition === "right"}
              onChange={() => handleMissingPositionChange("right")}
              className="absolute -top-2 -right-2 w-4 h-4"
              disabled={disabled}
              title="Position à trouver"
            />
          </div>

          {/* Bottom row */}
          <div className="col-start-2">
            <div className="relative">
              <Input
                value={data.bottom}
                onChange={(e) => handlePositionChange("bottom", e.target.value)}
                placeholder="Ex: D16"
                className="text-center font-mono text-lg"
                disabled={disabled}
              />
              <input
                type="radio"
                name="missingPosition"
                checked={data.missingPosition === "bottom"}
                onChange={() => handleMissingPositionChange("bottom")}
                className="absolute -top-2 -right-2 w-4 h-4"
                disabled={disabled}
                title="Position à trouver"
              />
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Cochez la case radio pour indiquer la position à trouver
        </p>
      </div>

      {/* Logic explanations (optional) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="horizontalLogic">Logique horizontale (optionnel)</Label>
          <Textarea
            id="horizontalLogic"
            value={data.horizontalLogic || ""}
            onChange={(e) => handlePositionChange("horizontalLogic", e.target.value)}
            placeholder="Ex: Suite +1 lettre, ×2 chiffre"
            className="min-h-[60px]"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="verticalLogic">Logique verticale (optionnel)</Label>
          <Textarea
            id="verticalLogic"
            value={data.verticalLogic || ""}
            onChange={(e) => handlePositionChange("verticalLogic", e.target.value)}
            placeholder="Ex: Suite +2 lettres, puissance de 2"
            className="min-h-[60px]"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
