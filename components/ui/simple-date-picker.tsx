"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SimpleCalendar } from "@/components/ui/simple-calendar";

export interface SimpleDatePickerProps {
  date?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  format?: string;
  calendarClassName?: string;
  showTimeSelect?: boolean;
}

export function SimpleDatePicker({
  date,
  onChange,
  disabled,
  placeholder = "Pick a date",
  className,
  format: dateFormat = "PPP",
  calendarClassName,
  showTimeSelect = false,
}: SimpleDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);
  const [timeValue, setTimeValue] = React.useState(() => {
    if (date && showTimeSelect) {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    return "00:00";
  });

  // Sync with external date changes
  React.useEffect(() => {
    setSelectedDate(date);
    if (date && showTimeSelect) {
      setTimeValue(`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`);
    }
  }, [date, showTimeSelect]);

  const handleSelect = (selectedDate: Date | { from: Date; to?: Date } | undefined) => {
    if (selectedDate && selectedDate instanceof Date) {
      setSelectedDate(selectedDate);
    }
  };

  const handleConfirm = () => {
    if (selectedDate && onChange) {
      const finalDate = new Date(selectedDate);
      
      if (showTimeSelect) {
        const [hours, minutes] = timeValue.split(':').map(Number);
        finalDate.setHours(hours, minutes, 0, 0);
      }
      
      onChange(finalDate);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setSelectedDate(date);
    if (date && showTimeSelect) {
      setTimeValue(`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`);
    }
    setIsOpen(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeValue(e.target.value);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, showTimeSelect ? "PPP 'a las' HH:mm" : dateFormat) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center">
        <div className="p-3">
          <SimpleCalendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            className={calendarClassName}
          />
          
          {showTimeSelect && (
            <div className="pt-3 border-t">
              <label className="block text-sm font-medium mb-2">Hora</label>
              <input
                type="time"
                value={timeValue}
                onChange={handleTimeChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          
          <div className="flex gap-2 pt-3 border-t mt-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleConfirm}
              disabled={!selectedDate}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
