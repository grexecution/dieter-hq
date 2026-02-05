"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  GlassCard,
  GlassButton,
  Badge,
  Button,
  ScrollArea,
} from "@/components/ui";
import {
  CalendarEvent,
  startOfWeek,
  addDays,
  addWeeks,
  getWeekDays,
  getEventsForDay,
  getEventColor,
  formatTime,
  formatDateShort,
  isToday,
  isSameDay,
  DEMO_EVENTS,
} from "@/lib/calendar-data";
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock } from "lucide-react";

// ============================================
// Types
// ============================================

interface CalendarWeekViewProps {
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (date: Date) => void;
  onAddEvent?: (date: Date) => void;
}

// ============================================
// Time Grid Component (Desktop)
// ============================================

interface TimeGridProps {
  days: Date[];
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (date: Date, hour: number) => void;
}

function TimeGrid({ days, events, onEventClick, onSlotClick }: TimeGridProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const workHours = hours.filter((h) => h >= 6 && h <= 22);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to current time on mount
  React.useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const scrollTarget = Math.max(0, (currentHour - 7) * 60);
      scrollRef.current.scrollTop = scrollTarget;
    }
  }, []);

  const getEventPosition = (event: CalendarEvent, dayDate: Date) => {
    const dayStart = new Date(dayDate).setHours(0, 0, 0, 0);
    const eventStart = Math.max(event.startAt, dayStart);
    const dayEnd = new Date(dayDate).setHours(23, 59, 59, 999);
    const eventEnd = Math.min(event.endAt, dayEnd);

    const startHour = new Date(eventStart).getHours();
    const startMin = new Date(eventStart).getMinutes();
    const endHour = new Date(eventEnd).getHours();
    const endMin = new Date(eventEnd).getMinutes();

    const top = (startHour - 6) * 60 + startMin;
    const height = (endHour - startHour) * 60 + (endMin - startMin);

    return { top: Math.max(0, top), height: Math.max(30, height) };
  };

  return (
    <div className="flex flex-1 overflow-hidden rounded-xl border glass">
      {/* Time labels column */}
      <div className="w-14 flex-shrink-0 border-r bg-muted/30">
        <div className="h-12 border-b" /> {/* Spacer for header */}
        <div ref={scrollRef} className="overflow-y-auto h-[calc(100%-48px)]">
          {workHours.map((hour) => (
            <div
              key={hour}
              className="h-[60px] flex items-start justify-end pr-2 text-xs text-muted-foreground"
            >
              <span className="-mt-2">
                {hour.toString().padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Days columns */}
      <div className="flex flex-1 overflow-x-auto">
        {days.map((day) => {
          const dayKey = day.toISOString().split("T")[0];
          const dayEvents = getEventsForDay(events, day).filter((e) => !e.allDay);
          const allDayEvents = getEventsForDay(events, day).filter((e) => e.allDay);
          const today = isToday(day);

          return (
            <div
              key={dayKey}
              className={cn(
                "flex-1 min-w-[120px] border-r last:border-r-0",
                today && "bg-primary/5"
              )}
            >
              {/* Day header */}
              <div
                className={cn(
                  "h-12 p-2 border-b text-center",
                  today && "bg-primary/10"
                )}
              >
                <div className="text-xs text-muted-foreground">
                  {day.toLocaleDateString("de-AT", { weekday: "short" })}
                </div>
                <div
                  className={cn(
                    "text-sm font-semibold",
                    today &&
                      "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mx-auto"
                  )}
                >
                  {day.getDate()}
                </div>
              </div>

              {/* All-day events */}
              {allDayEvents.length > 0 && (
                <div className="p-1 border-b bg-muted/20">
                  {allDayEvents.slice(0, 2).map((event) => {
                    const color = getEventColor(event.color);
                    return (
                      <button
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className={cn(
                          "w-full text-left text-[10px] px-1 py-0.5 rounded truncate mb-0.5",
                          color.bg,
                          color.text
                        )}
                      >
                        {event.title}
                      </button>
                    );
                  })}
                  {allDayEvents.length > 2 && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      +{allDayEvents.length - 2} more
                    </div>
                  )}
                </div>
              )}

              {/* Time slots */}
              <ScrollArea className="h-[calc(100%-48px)]">
                <div className="relative">
                  {workHours.map((hour) => (
                    <div
                      key={hour}
                      className="h-[60px] border-b border-border/30 hover:bg-muted/30 cursor-pointer"
                      onClick={() => onSlotClick(day, hour)}
                    />
                  ))}

                  {/* Events */}
                  {dayEvents.map((event) => {
                    const pos = getEventPosition(event, day);
                    const color = getEventColor(event.color);

                    return (
                      <button
                        key={event.id}
                        className={cn(
                          "absolute left-1 right-1 px-1.5 py-1 rounded text-left overflow-hidden",
                          "border-l-2 transition-all hover:shadow-md",
                          color.bg,
                          color.text
                        )}
                        style={{
                          top: `${pos.top}px`,
                          height: `${pos.height}px`,
                          borderLeftColor: `hsl(var(--primary))`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      >
                        <div className="text-[10px] font-medium truncate">
                          {event.title}
                        </div>
                        {pos.height > 40 && (
                          <div className="text-[9px] opacity-80">
                            {formatTime(event.startAt)}
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {/* Current time indicator */}
                  {today && (
                    <div
                      className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
                      style={{
                        top: `${(new Date().getHours() - 6) * 60 + new Date().getMinutes()}px`,
                      }}
                    >
                      <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Mobile Day List Component
// ============================================

interface DayListProps {
  days: Date[];
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

function DayList({
  days,
  events,
  selectedDate,
  onSelectDate,
  onEventClick,
}: DayListProps) {
  const selectedEvents = getEventsForDay(events, selectedDate);

  return (
    <div className="flex flex-col h-full">
      {/* Day selector strip */}
      <div className="flex overflow-x-auto gap-1 p-2 border-b">
        {days.map((day) => {
          const dayKey = day.toISOString().split("T")[0];
          const today = isToday(day);
          const selected = isSameDay(day, selectedDate);
          const hasEvents = getEventsForDay(events, day).length > 0;

          return (
            <button
              key={dayKey}
              onClick={() => onSelectDate(day)}
              className={cn(
                "flex-shrink-0 w-12 py-2 rounded-xl text-center transition-all",
                selected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted",
                today && !selected && "ring-2 ring-primary ring-offset-2"
              )}
            >
              <div className="text-[10px] uppercase opacity-70">
                {day.toLocaleDateString("de-AT", { weekday: "short" })}
              </div>
              <div className="text-lg font-semibold">{day.getDate()}</div>
              {hasEvents && !selected && (
                <div className="w-1 h-1 mx-auto mt-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Events list for selected day */}
      <ScrollArea className="flex-1 p-4">
        {selectedEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-4xl mb-2">📅</div>
            <p>No events on this day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedEvents.map((event) => {
              const color = getEventColor(event.color);
              return (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl glass transition-all",
                    "hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
                    "border-l-4"
                  )}
                  style={{ borderLeftColor: `hsl(var(--primary))` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className={cn(color.bg, color.text)}>
                      {event.allDay ? "All day" : formatTime(event.startAt)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {!event.allDay && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(event.startAt)} - {formatTime(event.endAt)}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ============================================
// Main Week View Component
// ============================================

export function CalendarWeekView({
  events = DEMO_EVENTS,
  onEventClick,
  onDayClick,
  onAddEvent,
}: CalendarWeekViewProps) {
  const [weekStart, setWeekStart] = React.useState(() => startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = React.useState(() => new Date());
  const [isMobile, setIsMobile] = React.useState(false);

  // Check for mobile viewport
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const days = getWeekDays(weekStart);

  const goToPreviousWeek = () => setWeekStart((prev) => addWeeks(prev, -1));
  const goToNextWeek = () => setWeekStart((prev) => addWeeks(prev, 1));
  const goToToday = () => {
    const today = new Date();
    setWeekStart(startOfWeek(today));
    setSelectedDate(today);
  };

  const handleEventClick = (event: CalendarEvent) => {
    onEventClick?.(event);
  };

  const handleSlotClick = (date: Date, hour: number) => {
    const slotDate = new Date(date);
    slotDate.setHours(hour, 0, 0, 0);
    onAddEvent?.(slotDate);
  };

  const formatWeekRange = () => {
    const end = addDays(weekStart, 6);
    if (weekStart.getMonth() === end.getMonth()) {
      return `${weekStart.getDate()}–${end.getDate()} ${weekStart.toLocaleDateString(
        "de-AT",
        { month: "long", year: "numeric" }
      )}`;
    }
    return `${formatDateShort(weekStart)} – ${formatDateShort(end)}`;
  };

  return (
    <GlassCard className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]" padding="none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>

          <div className="flex items-center rounded-md border bg-background">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={goToPreviousWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={goToNextWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <h2 className="text-lg font-semibold">{formatWeekRange()}</h2>

        <GlassButton
          variant="glass-primary"
          size="sm"
          onClick={() => onAddEvent?.(selectedDate)}
        >
          <Plus className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">New Event</span>
        </GlassButton>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isMobile ? (
          <DayList
            days={days}
            events={events}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onEventClick={handleEventClick}
          />
        ) : (
          <TimeGrid
            days={days}
            events={events}
            onEventClick={handleEventClick}
            onSlotClick={handleSlotClick}
          />
        )}
      </div>
    </GlassCard>
  );
}

export default CalendarWeekView;
