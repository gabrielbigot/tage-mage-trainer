"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, ArrowRight, ArrowDown } from "lucide-react";
import { DoubleSeriesData } from "@/lib/types";

interface DoubleSeriesFormProps {
  value: DoubleSeriesData;
  onChange: (data: DoubleSeriesData) => void;
}

export function DoubleSeriesForm({ value, onChange }: DoubleSeriesFormProps) {
  const handleHorizontalSeriesChange = (index: number, val: string) => {
    const newSeries = [...value.horizontalSeries];
    newSeries[index] = val;
    onChange({ ...value, horizontalSeries: newSeries });
  };

  const handleVerticalSeriesChange = (index: number, val: string) => {
    const newSeries = [...value.verticalSeries];
    newSeries[index] = val;
    onChange({ ...value, verticalSeries: newSeries });
  };

  const addHorizontalElement = () => {
    onChange({
      ...value,
      horizontalSeries: [...value.horizontalSeries, ""],
    });
  };

  const addVerticalElement = () => {
    onChange({
      ...value,
      verticalSeries: [...value.verticalSeries, ""],
    });
  };

  const removeHorizontalElement = (index: number) => {
    if (value.horizontalSeries.length > 2) {
      onChange({
        ...value,
        horizontalSeries: value.horizontalSeries.filter((_, i) => i !== index),
      });
    }
  };

  const removeVerticalElement = (index: number) => {
    if (value.verticalSeries.length > 2) {
      onChange({
        ...value,
        verticalSeries: value.verticalSeries.filter((_, i) => i !== index),
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-blue-600" />
            Série Horizontale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="horizontal-label" className="text-xs">
              Label (optionnel)
            </Label>
            <Input
              id="horizontal-label"
              value={value.horizontalLabel || ""}
              onChange={(e) =>
                onChange({ ...value, horizontalLabel: e.target.value })
              }
              placeholder="Ex: Série alphabétique"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Éléments de la série</Label>
            <div className="flex flex-wrap gap-2">
              {value.horizontalSeries.map((element, index) => (
                <div key={index} className="flex gap-1 items-center">
                  <Input
                    value={element}
                    onChange={(e) =>
                      handleHorizontalSeriesChange(index, e.target.value)
                    }
                    placeholder={index === value.horizontalSeries.length - 1 ? "?" : ""}
                    className="w-16 text-center font-mono"
                  />
                  {value.horizontalSeries.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeHorizontalElement(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addHorizontalElement}
              className="w-full mt-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              Ajouter un élément
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ArrowDown className="h-4 w-4 text-green-600" />
            Série Verticale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="vertical-label" className="text-xs">
              Label (optionnel)
            </Label>
            <Input
              id="vertical-label"
              value={value.verticalLabel || ""}
              onChange={(e) =>
                onChange({ ...value, verticalLabel: e.target.value })
              }
              placeholder="Ex: Série numérique"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Éléments de la série</Label>
            <div className="flex flex-wrap gap-2">
              {value.verticalSeries.map((element, index) => (
                <div key={index} className="flex gap-1 items-center">
                  <Input
                    value={element}
                    onChange={(e) =>
                      handleVerticalSeriesChange(index, e.target.value)
                    }
                    placeholder={index === value.verticalSeries.length - 1 ? "?" : ""}
                    className="w-16 text-center font-mono"
                  />
                  {value.verticalSeries.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeVerticalElement(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVerticalElement}
              className="w-full mt-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              Ajouter un élément
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">
          <strong>Aperçu de la matrice :</strong>
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-blue-600 mb-1">
              {value.horizontalLabel || "Série horizontale"}
            </p>
            <div className="flex gap-1">
              {value.horizontalSeries.map((el, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 text-xs font-mono rounded ${
                    el === "?" || el === ""
                      ? "bg-blue-200 text-blue-900"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {el || "?"}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-green-600 mb-1">
              {value.verticalLabel || "Série verticale"}
            </p>
            <div className="flex gap-1">
              {value.verticalSeries.map((el, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 text-xs font-mono rounded ${
                    el === "?" || el === ""
                      ? "bg-green-200 text-green-900"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {el || "?"}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
