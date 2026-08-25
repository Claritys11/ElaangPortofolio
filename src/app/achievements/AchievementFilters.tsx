"use client"

import { Award, CalendarDays, Filter, RotateCcw, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AchievementCategoryFilter, AchievementSortMode } from "@/lib/achievement-utils"

interface AchievementFiltersProps {
  categoryFilter: AchievementCategoryFilter
  sourceFilter: string
  sortMode: AchievementSortMode
  sourceOptions: string[]
  shownCount: number
  totalCount: number
  onCategoryChange: (value: AchievementCategoryFilter) => void
  onSourceChange: (value: string) => void
  onSortChange: (value: AchievementSortMode) => void
  onReset: () => void
}

export function AchievementFilters({
  categoryFilter,
  sourceFilter,
  sortMode,
  sourceOptions,
  shownCount,
  totalCount,
  onCategoryChange,
  onSourceChange,
  onSortChange,
  onReset,
}: AchievementFiltersProps) {
  const hasActiveFilters = categoryFilter !== "all" || sourceFilter !== "all" || sortMode !== "best"

  return (
    <div className="mb-10 rounded-xl border border-border/70 bg-background/75 p-4 backdrop-blur-md">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-code uppercase tracking-widest text-muted-foreground">
            <Filter className="h-3.5 w-3.5 text-primary" />
            Category
          </div>
          <Select value={categoryFilter} onValueChange={(value) => onCategoryChange(value as AchievementCategoryFilter)}>
            <SelectTrigger className="bg-background/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="certification">Certifications</SelectItem>
              <SelectItem value="competition">Competitions</SelectItem>
              <SelectItem value="milestone">Milestones</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-code uppercase tracking-widest text-muted-foreground">
            <Award className="h-3.5 w-3.5 text-primary" />
            Source
          </div>
          <Select value={sourceFilter} onValueChange={onSourceChange}>
            <SelectTrigger className="bg-background/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {sourceOptions.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-code uppercase tracking-widest text-muted-foreground">
            {sortMode === "best" ? (
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            ) : (
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
            )}
            Sort by
          </div>
          <Select value={sortMode} onValueChange={(value) => onSortChange(value as AchievementSortMode)}>
            <SelectTrigger className="bg-background/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="best">Best proof</SelectItem>
              <SelectItem value="newest">Newest date</SelectItem>
              <SelectItem value="oldest">Oldest date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            size="default"
            className="w-full md:w-11 md:px-0"
            disabled={!hasActiveFilters}
            title="Reset filters"
            aria-label="Reset filters"
            onClick={onReset}
          >
            <RotateCcw className="h-4 w-4" />
            <span className="md:sr-only">Reset</span>
          </Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline">{shownCount} shown</Badge>
        <span>{totalCount} total records</span>
      </div>
    </div>
  )
}
