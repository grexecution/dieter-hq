"use client";

import * as React from "react";
import { CalendarView } from "./CalendarView";
import { CalendarWeekView } from "./CalendarWeekView";
import { AppShell } from "../_ui/AppShell";
import { GlassCard, GlassButton, Button, Badge } from "@/components/ui";
import { 
  DEMO_EVENTS, 
  getUpcomingEvents, 
  formatTime, 
  getEventColor,
  formatDateFull,
} from "@/lib/calendar-data";
import { CalendarDays, CalendarRange, Clock, MapPin, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week";

function UpcomingSidebar() {
  const upcoming = getUpcomingEvents(DEMO_EVENTS, 5);

  return (
    <GlassCard variant="subtle" className="hidden lg:block w-80" padding="none">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Upcoming Events</h3>
        <p className="text-xs text-muted-foreground mt-1">Next 5 events</p>
      </div>
      
      <div className="p-2">
        {upcoming.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <div className="text-3xl mb-2">📅</div>
            <p className="text-sm">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-1">
            {upcoming.map((event) => {
              const color = getEventColor(event.color);
              const eventDate = new Date(event.startAt);
              const isToday = new Date().toDateString() === eventDate.toDateString();
              const isTomorrow = new Date(Date.now() + 86400000).toDateString() === eventDate.toDateString();

              return (
                <button
                  key={event.id}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-all",
                    "hover:bg-muted/50 group"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Date indicator */}
                    <div className={cn(
                      "flex-shrink-0 w-12 text-center py-1 rounded-lg",
                      isToday ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <div className="text-[10px] uppercase">
                        {isToday ? "Today" : isTomorrow ? "Tmr" : eventDate.toLocaleDateString("de-AT", { weekday: "short" })}
                      </div>
                      <div className="text-lg font-bold">{eventDate.getDate()}</div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate text-sm">{event.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {event.allDay ? "All day" : formatTime(event.startAt)}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export default function CalendarPage() {
  const [viewMode, setViewMode] = React.useState<ViewMode>("month");

  return (
    <AppShell active="calendar">
      <div className="flex gap-6">
        {/* Main Calendar Area */}
        <div className="flex-1 min-w-0">
          {/* View Switcher Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Calendar</h1>
              <p className="text-sm text-muted-foreground">
                {formatDateFull(new Date())}
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg glass">
              <Button
                variant={viewMode === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("month")}
                className="gap-2"
              >
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Month</span>
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("week")}
                className="gap-2"
              >
                <CalendarRange className="h-4 w-4" />
                <span className="hidden sm:inline">Week</span>
              </Button>
            </div>
          </div>

          {/* Calendar View */}
          {viewMode === "month" ? (
            <CalendarView />
          ) : (
            <CalendarWeekView events={DEMO_EVENTS} />
          )}
        </div>

        {/* Upcoming Events Sidebar */}
        <UpcomingSidebar />
      </div>
    </AppShell>
  );
}
