"use client";

import * as React from "react";
import { DayPicker, DayPickerProps } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";

export type CalendarProps = DayPickerProps;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: cn(
          "text-sm font-medium text-foreground",
          props.captionLayout === "dropdown" && "hidden"
        ),
        nav: "flex items-center gap-1",
        button_previous: cn(
          "absolute left-1 min-h-[44px] min-w-[44px] bg-transparent p-0 opacity-50 hover:opacity-100 active:opacity-100 active:scale-[0.98] flex items-center justify-center text-foreground hover:bg-purple-900/50 active:bg-purple-900/70 rounded-md transition-colors",
          props.captionLayout === "dropdown" && "left-0" // Adjust nav position if needed, optional but safe
        ),
        button_next: cn(
          "absolute right-1 min-h-[44px] min-w-[44px] bg-transparent p-0 opacity-50 hover:opacity-100 active:opacity-100 active:scale-[0.98] flex items-center justify-center text-foreground hover:bg-purple-900/50 active:bg-purple-900/70 rounded-md transition-colors",
          props.captionLayout === "dropdown" && "right-0"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-11 font-normal text-[0.8rem] text-center",
        week: "flex w-full mt-2",
        day: "size-11 text-center text-sm p-0 relative focus-within:z-20",
        day_button: cn(
          "size-11 p-0 font-normal text-foreground hover:bg-purple-900/50 active:bg-purple-900/70 active:scale-[0.98] rounded-md transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-background"
        ),
        selected: "bg-purple-600 text-white hover:bg-purple-600 hover:text-white focus:bg-purple-600 focus:text-white rounded-md",
        today: "bg-purple-900/30 text-purple-300 rounded-md",
        outside: "text-text-tertiary opacity-50",
        disabled: "text-text-tertiary opacity-50 cursor-not-allowed",
        hidden: "invisible",
        // Dropdown styles for month/year selection
        dropdowns: "flex items-center justify-center gap-2",
        dropdown: "relative",
        dropdown_root: "relative inline-block",
        months_dropdown: cn(
          "appearance-none bg-surface-sunken border border-purple-900/50 rounded-lg px-3 py-1.5",
          "text-foreground text-sm font-medium cursor-pointer",
          "hover:border-purple-500/70 hover:bg-purple-900/20",
          "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",
          "transition-all duration-200"
        ),
        years_dropdown: cn(
          "appearance-none bg-surface-sunken border border-purple-900/50 rounded-lg px-3 py-1.5",
          "text-foreground text-sm font-medium cursor-pointer",
          "hover:border-purple-500/70 hover:bg-purple-900/20",
          "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",
          "transition-all duration-200"
        ),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
