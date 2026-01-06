"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, ArrowRight, ArrowDown } from "lucide-react";
import { DoubleSeriesData } from "@/lib/types";
import { DoubleSeriesDisplay } from "@/components/double-series-display";

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

  const toggleHorizontalQuestion = (index: number) => {
    const newSeries = value.horizontalSeries.map((el, i) =>
      i === index ? "?" : (el === "?" ? "" : el)
    );
    onChange({ ...value, horizontalSeries: newSeries });
  };

  const toggleVerticalQuestion = (index: number) => {
    const newSeries = value.verticalSeries.map((el, i) =>
      i === index ? "?" : (el === "?" ? "" : el)
    );
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
            <p className="text-xs text-muted-foreground">
              Cliquez sur le bouton ? pour marquer la valeur inconnue
            </p>
            <div className="flex flex-wrap gap-2">
              {value.horizontalSeries.map((element, index) => (
                <div key={index} className="flex gap-1 items-center">
                  <div className="relative">
                    <Input
                      value={element === "?" ? "" : element}
                      onChange={(e) =>
                        handleHorizontalSeriesChange(index, e.target.value)
                      }
                      placeholder={element === "?" ? "?" : `${index + 1}`}
                      className={`w-16 text-center font-mono ${
                        element === "?" ? "bg-blue-200 dark:bg-blue-900" : ""
                      }`}
                      disabled={element === "?"}
                    />
                    {element === "?" && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-blue-600">?</span>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant={element === "?" ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => toggleHorizontalQuestion(index)}
                    title="Marquer comme inconnue"
                  >
                    <span className="text-sm font-bold">?</span>
                  </Button>
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
            <p className="text-xs text-muted-foreground">
              Cliquez sur le bouton ? pour marquer la valeur inconnue
            </p>
            <div className="flex flex-wrap gap-2">
              {value.verticalSeries.map((element, index) => (
                <div key={index} className="flex gap-1 items-center">
                  <div className="relative">
                    <Input
                      value={element === "?" ? "" : element}
                      onChange={(e) =>
                        handleVerticalSeriesChange(index, e.target.value)
                      }
                      placeholder={element === "?" ? "?" : `${index + 1}`}
                      className={`w-16 text-center font-mono ${
                        element === "?" ? "bg-green-200 dark:bg-green-900" : ""
                      }`}
                      disabled={element === "?"}
                    />
                    {element === "?" && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-green-600">?</span>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant={element === "?" ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => toggleVerticalQuestion(index)}
                    title="Marquer comme inconnue"
                  >
                    <span className="text-sm font-bold">?</span>
                  </Button>
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

      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Aperçu de la matrice croisée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DoubleSeriesDisplay data={value} />
        </CardContent>
      </Card>
    </div>
  );
}
