"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CalendarProps {
  mode?: "single" | "range"
  selected?: Date | { from?: Date; to?: Date }
  onSelect?: (date: Date | { from?: Date; to?: Date } | undefined) => void
  className?: string
  disabled?: boolean
}

export function Calendar({
  mode = "single",
  selected,
  onSelect,
  className,
  disabled,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    if (mode === "single" && selected instanceof Date) {
      return new Date(selected.getFullYear(), selected.getMonth(), 1)
    }
    if (mode === "range" && selected && typeof selected === "object" && "from" in selected && selected.from) {
      return new Date(selected.from.getFullYear(), selected.from.getMonth(), 1)
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  })

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    )
  }

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    )
  }

  const isSelected = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    
    if (mode === "single" && selected instanceof Date) {
      return date.toDateString() === selected.toDateString()
    }
    
    if (mode === "range" && selected && typeof selected === "object" && "from" in selected) {
      const { from, to } = selected
      if (from && date.toDateString() === from.toDateString()) return true
      if (to && date.toDateString() === to.toDateString()) return true
    }
    
    return false
  }

  const isInRange = (day: number) => {
    if (mode !== "range" || !selected || typeof selected !== "object" || !("from" in selected)) {
      return false
    }
    
    const { from, to } = selected
    if (!from || !to) return false
    
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date > from && date < to
  }

  const handleDayClick = (day: number) => {
    if (disabled) return
    
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    
    if (mode === "single") {
      onSelect?.(date)
    } else if (mode === "range") {
      const rangeSelected = selected as { from?: Date; to?: Date } | undefined
      
      if (!rangeSelected?.from || (rangeSelected.from && rangeSelected.to)) {
        onSelect?.({ from: date, to: undefined })
      } else if (rangeSelected.from && !rangeSelected.to) {
        if (date < rangeSelected.from) {
          onSelect?.({ from: date, to: rangeSelected.from })
        } else {
          onSelect?.({ from: rangeSelected.from, to: date })
        }
      }
    }
  }

  const days: (number | null)[] = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={prevMonth}
          disabled={disabled}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-medium">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={nextMonth}
          disabled={disabled}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs text-muted-foreground font-medium py-1"
          >
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div key={index} className="aspect-square">
            {day !== null && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-full w-full p-0 font-normal",
                  isSelected(day) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  isInRange(day) && "bg-primary/20"
                )}
                onClick={() => handleDayClick(day)}
                disabled={disabled}
              >
                {day}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
