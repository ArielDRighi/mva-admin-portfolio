"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  getDay
} from "date-fns";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type SimpleCalendarProps = {
  mode?: "single" | "range";
  selected?: Date | { from: Date; to?: Date };
  onSelect?: (date: Date | { from: Date; to?: Date } | undefined) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  month?: Date;
  onMonthChange?: (date: Date) => void;
};

export function SimpleCalendar({
  className,
  mode = "single",
  selected,
  onSelect,
  disabled,
  month,
  onMonthChange,
}: SimpleCalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState<Date>(month || new Date());
  
  const currentMonth = month || internalMonth;
  
  // Handle month change
  const handleMonthChange = React.useCallback((date: Date) => {
    if (onMonthChange) {
      onMonthChange(date);
    } else {
      setInternalMonth(date);
    }
  }, [onMonthChange]);
  
  const handlePreviousMonth = () => {
    handleMonthChange(subMonths(currentMonth, 1));
  };
  
  const handleNextMonth = () => {
    handleMonthChange(addMonths(currentMonth, 1));
  };

  // Check if a date is selected
  const isDateSelected = (date: Date) => {
    if (!selected) return false;

    if (mode === "single" && selected instanceof Date) {
      return isSameDay(date, selected);
    }

    if (mode === "range" && !(selected instanceof Date) && selected.from) {
      if (!selected.to) {
        return isSameDay(date, selected.from);
      }
      return (
        isSameDay(date, selected.from) || 
        isSameDay(date, selected.to) ||
        (date > selected.from && date < selected.to!)
      );
    }

    return false;
  };

  // Date selection handler
  const handleDateSelect = (date: Date) => {
    if (onSelect) {
      if (mode === "single") {
        onSelect(date);
      } else if (mode === "range") {
        const currentSelection = selected as { from?: Date; to?: Date } | undefined;
        
        if (!currentSelection || !currentSelection.from || currentSelection.to) {
          onSelect({ from: date });
        } else {
          if (date < currentSelection.from) {
            onSelect({ from: date, to: currentSelection.from });
          } else {
            onSelect({ from: currentSelection.from, to: date });
          }
        }
      }
    }
  };

  // Generate days for the month
  const renderMonthDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = getDay(startOfMonth(currentMonth));
    
    // Add empty cells for days before start of month
    const prefixDays = Array.from({ length: firstDayOfMonth }, (_, i) => (
      <div key={`empty-${i}`} className="h-9 w-9" />
    ));
    
    // Render days
    const monthDays = days.map(day => {
      const isSelected = isDateSelected(day);
      const isToday = isSameDay(day, new Date());
      const isDisabled = disabled ? disabled(day) : false;
      
      return (
        <button
          type="button"
          key={format(day, 'yyyy-MM-dd')}
          onClick={() => !isDisabled && handleDateSelect(day)}
          disabled={isDisabled}
          className={cn(
            "h-9 w-9 rounded-md p-0 font-normal",
            isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
            !isSelected && isToday && "bg-accent text-accent-foreground",
            !isSelected && !isToday && "text-foreground hover:bg-accent hover:text-accent-foreground",
            isDisabled && "text-muted-foreground opacity-50 cursor-not-allowed"
          )}
        >
          {format(day, "d")}
        </button>
      );
    });
    
    return [...prefixDays, ...monthDays];
  };
  
  // Render header with month and year
  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-2 py-1">
        <button
          type="button"
          onClick={handlePreviousMonth}
          className={cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "h-7 w-7 bg-transparent p-0"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous month</span>
        </button>
        
        <h2 className="text-sm font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        
        <button
          type="button"
          onClick={handleNextMonth}
          className={cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "h-7 w-7 bg-transparent p-0"
          )}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next month</span>
        </button>
      </div>
    );
  };
  
  // Render weekday names
  const renderWeekdayNames = () => {
    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    
    return (
      <div className="flex justify-center gap-1">
        {weekdays.map(day => (
          <div key={day} className="flex h-9 w-9 items-center justify-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("p-3", className)}>
      <div className="space-y-4">
        {renderHeader()}
        {renderWeekdayNames()}
        <div className="grid grid-cols-7 gap-1">
          {renderMonthDays()}
        </div>
      </div>
    </div>
  );
}
