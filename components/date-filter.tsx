"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, X, ChevronDown, ChevronUp } from "lucide-react";

export interface DateFilterValue {
  mode: "all" | "preset" | "custom";
  preset?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

interface DateFilterProps {
  /** All available dates from the questions (YYYY-MM-DD format) */
  availableDates: string[];
  value: DateFilterValue;
  onChange: (value: DateFilterValue) => void;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getStartOfWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function getStartOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function getStartOfLastMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function getEndOfLastMonth(): string {
  const d = new Date();
  d.setDate(0); // last day of previous month
  return d.toISOString().split("T")[0];
}

function getDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function formatDateFr(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

/** Count questions matching a date range */
function countInRange(dates: string[], start: string, end: string): number {
  return dates.filter(d => d >= start && d <= end).length;
}

const PRESETS = [
  { id: "today", label: "Aujourd'hui", getRange: () => [getToday(), getToday()] as const },
  { id: "yesterday", label: "Hier", getRange: () => [getDaysAgo(1), getDaysAgo(1)] as const },
  { id: "this-week", label: "Cette semaine", getRange: () => [getStartOfWeek(), getToday()] as const },
  { id: "last-7", label: "7 derniers jours", getRange: () => [getDaysAgo(6), getToday()] as const },
  { id: "this-month", label: "Ce mois-ci", getRange: () => [getStartOfMonth(), getToday()] as const },
  { id: "last-30", label: "30 derniers jours", getRange: () => [getDaysAgo(29), getToday()] as const },
  { id: "last-month", label: "Mois dernier", getRange: () => [getStartOfLastMonth(), getEndOfLastMonth()] as const },
];

export function DateFilter({ availableDates, value, onChange }: DateFilterProps) {
  const [expanded, setExpanded] = useState(false);

  // Build summary of available dates
  const stats = useMemo(() => {
    if (availableDates.length === 0) return null;
    const sorted = [...availableDates].sort();
    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];

    // Count by month for the mini-timeline
    const months = new Map<string, number>();
    for (const d of sorted) {
      const key = d.substring(0, 7); // YYYY-MM
      months.set(key, (months.get(key) || 0) + 1);
    }

    return { oldest, newest, total: sorted.length, months };
  }, [availableDates]);

  const isActive = value.mode !== "all";

  // Calculate count for active filter
  const activeCount = useMemo(() => {
    if (value.mode === "all") return availableDates.length;
    if (value.mode === "preset" && value.preset) {
      const preset = PRESETS.find(p => p.id === value.preset);
      if (preset) {
        const [start, end] = preset.getRange();
        return countInRange(availableDates, start, end);
      }
    }
    if (value.mode === "custom" && value.startDate && value.endDate) {
      return countInRange(availableDates, value.startDate, value.endDate);
    }
    return availableDates.length;
  }, [value, availableDates]);

  if (!stats) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Date d&apos;ajout
          {isActive && (
            <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-normal">
              {activeCount} question{activeCount !== 1 ? "s" : ""}
            </span>
          )}
        </Label>
        <div className="flex items-center gap-1">
          {isActive && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => onChange({ mode: "all" })}
            >
              <X className="h-3 w-3 mr-1" />
              Effacer
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Quick presets - always visible */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={value.mode === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onChange({ mode: "all" })}
        >
          Toutes
        </Button>
        {PRESETS.slice(0, 4).map((preset) => {
          const [start, end] = preset.getRange();
          const count = countInRange(availableDates, start, end);
          const isSelected = value.mode === "preset" && value.preset === preset.id;
          return (
            <Button
              key={preset.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({ mode: "preset", preset: preset.id })}
              disabled={count === 0}
              className="relative"
            >
              {preset.label}
              {count > 0 && !isSelected && (
                <span className="ml-1 text-xs opacity-60">({count})</span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Expanded view */}
      {expanded && (
        <div className="space-y-3 pt-1">
          {/* More presets */}
          <div className="flex gap-2 flex-wrap">
            {PRESETS.slice(4).map((preset) => {
              const [start, end] = preset.getRange();
              const count = countInRange(availableDates, start, end);
              const isSelected = value.mode === "preset" && value.preset === preset.id;
              return (
                <Button
                  key={preset.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => onChange({ mode: "preset", preset: preset.id })}
                  disabled={count === 0}
                >
                  {preset.label}
                  {count > 0 && !isSelected && (
                    <span className="ml-1 text-xs opacity-60">({count})</span>
                  )}
                </Button>
              );
            })}
            <Button
              variant={value.mode === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({
                mode: "custom",
                startDate: value.startDate || stats.oldest,
                endDate: value.endDate || getToday(),
              })}
            >
              Période personnalisée
            </Button>
          </div>

          {/* Custom date range */}
          {value.mode === "custom" && (
            <div className="flex gap-3 items-end p-3 rounded-lg border bg-muted/30">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Du</Label>
                <Input
                  type="date"
                  value={value.startDate || ""}
                  min={stats.oldest}
                  max={value.endDate || getToday()}
                  onChange={(e) => onChange({ ...value, startDate: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Au</Label>
                <Input
                  type="date"
                  value={value.endDate || ""}
                  min={value.startDate || stats.oldest}
                  max={getToday()}
                  onChange={(e) => onChange({ ...value, endDate: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>
          )}

          {/* Mini timeline */}
          {stats.months.size > 1 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Répartition : {formatDateFr(stats.oldest)} → {formatDateFr(stats.newest)}
              </p>
              <div className="flex gap-0.5 h-8 items-end">
                {Array.from(stats.months.entries()).map(([month, count]) => {
                  const maxCount = Math.max(...stats.months.values());
                  const height = Math.max(4, (count / maxCount) * 100);
                  const isInRange = value.mode === "all" || isMonthInRange(month, value);
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-0.5">
                      <div
                        className={`w-full rounded-sm transition-colors ${
                          isInRange ? "bg-primary" : "bg-muted-foreground/20"
                        }`}
                        style={{ height: `${height}%` }}
                        title={`${formatMonthFr(month)}: ${count} question${count > 1 ? "s" : ""}`}
                      />
                      {stats.months.size <= 12 && (
                        <span className="text-[9px] text-muted-foreground leading-none">
                          {formatMonthShort(month)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function isMonthInRange(month: string, filter: DateFilterValue): boolean {
  const monthStart = `${month}-01`;
  const d = new Date(monthStart);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  const monthEnd = d.toISOString().split("T")[0];

  let start: string, end: string;
  if (filter.mode === "preset" && filter.preset) {
    const preset = PRESETS.find(p => p.id === filter.preset);
    if (!preset) return true;
    [start, end] = preset.getRange();
  } else if (filter.mode === "custom" && filter.startDate && filter.endDate) {
    start = filter.startDate;
    end = filter.endDate;
  } else {
    return true;
  }
  return monthEnd >= start && monthStart <= end;
}

function formatMonthFr(month: string): string {
  const d = new Date(month + "-01T00:00:00");
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function formatMonthShort(month: string): string {
  const d = new Date(month + "-01T00:00:00");
  return d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
}

/** Helper to check if a question's addedDate matches the filter */
export function matchesDateFilter(addedDate: string | undefined, filter: DateFilterValue): boolean {
  if (filter.mode === "all") return true;
  if (!addedDate) return false;

  let start: string, end: string;
  if (filter.mode === "preset" && filter.preset) {
    const preset = PRESETS.find(p => p.id === filter.preset);
    if (!preset) return true;
    [start, end] = preset.getRange();
  } else if (filter.mode === "custom" && filter.startDate && filter.endDate) {
    start = filter.startDate;
    end = filter.endDate;
  } else {
    return true;
  }

  return addedDate >= start && addedDate <= end;
}
