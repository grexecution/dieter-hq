/**
 * Calendar Data Models & Demo Data
 * Provides types, utilities, and demo content for the Calendar views
 */

// ============================================
// Types & Interfaces
// ============================================

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startAt: number; // timestamp
  endAt: number; // timestamp
  allDay: boolean;
  color?: EventColor;
  location?: string;
  recurring?: RecurringPattern;
  reminders: Reminder[];
  createdAt: number;
  updatedAt: number;
}

export type EventColor =
  | "blue"
  | "green"
  | "red"
  | "purple"
  | "orange"
  | "pink"
  | "teal"
  | "yellow";

export interface RecurringPattern {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  until?: number; // timestamp
  count?: number;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
}

export interface Reminder {
  id: string;
  minutesBefore: number;
  type: "notification" | "email";
}

export interface TimeSlot {
  hour: number;
  events: CalendarEvent[];
}

export type CalendarView = "day" | "week" | "month" | "agenda";

// ============================================
// Constants
// ============================================

export const EVENT_COLORS: { value: EventColor; label: string; bg: string; text: string }[] = [
  { value: "blue", label: "Blue", bg: "bg-blue-500/20", text: "text-blue-700 dark:text-blue-300" },
  { value: "green", label: "Green", bg: "bg-green-500/20", text: "text-green-700 dark:text-green-300" },
  { value: "red", label: "Red", bg: "bg-red-500/20", text: "text-red-700 dark:text-red-300" },
  { value: "purple", label: "Purple", bg: "bg-purple-500/20", text: "text-purple-700 dark:text-purple-300" },
  { value: "orange", label: "Orange", bg: "bg-orange-500/20", text: "text-orange-700 dark:text-orange-300" },
  { value: "pink", label: "Pink", bg: "bg-pink-500/20", text: "text-pink-700 dark:text-pink-300" },
  { value: "teal", label: "Teal", bg: "bg-teal-500/20", text: "text-teal-700 dark:text-teal-300" },
  { value: "yellow", label: "Yellow", bg: "bg-yellow-500/20", text: "text-yellow-700 dark:text-yellow-300" },
];

export const REMINDER_OPTIONS = [
  { value: 0, label: "At time of event" },
  { value: 5, label: "5 minutes before" },
  { value: 10, label: "10 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 120, label: "2 hours before" },
  { value: 1440, label: "1 day before" },
  { value: 2880, label: "2 days before" },
];

// ============================================
// Demo Data Generator
// ============================================

function generateId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const day = 24 * 60 * 60 * 1000;
const hour = 60 * 60 * 1000;

function setTime(date: Date, hours: number, minutes: number = 0): number {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
}

export const DEMO_EVENTS: CalendarEvent[] = [
  // Today's events
  {
    id: generateId(),
    title: "Team standup",
    description: "Daily sync with the team",
    startAt: setTime(today, 9, 0),
    endAt: setTime(today, 9, 30),
    allDay: false,
    color: "blue",
    reminders: [{ id: "r1", minutesBefore: 5, type: "notification" }],
    createdAt: today.getTime() - 7 * day,
    updatedAt: today.getTime() - 2 * day,
  },
  {
    id: generateId(),
    title: "Lunch with Sarah",
    description: "Catch up at the Italian place",
    startAt: setTime(today, 12, 30),
    endAt: setTime(today, 13, 30),
    allDay: false,
    color: "green",
    location: "Ristorante Milano",
    reminders: [{ id: "r2", minutesBefore: 30, type: "notification" }],
    createdAt: today.getTime() - 3 * day,
    updatedAt: today.getTime() - 3 * day,
  },
  {
    id: generateId(),
    title: "Project review",
    description: "Q1 project status review with stakeholders",
    startAt: setTime(today, 14, 0),
    endAt: setTime(today, 15, 30),
    allDay: false,
    color: "purple",
    reminders: [
      { id: "r3", minutesBefore: 15, type: "notification" },
      { id: "r4", minutesBefore: 60, type: "email" },
    ],
    createdAt: today.getTime() - 5 * day,
    updatedAt: today.getTime() - day,
  },
  {
    id: generateId(),
    title: "Gym session",
    description: "Strength training",
    startAt: setTime(today, 18, 0),
    endAt: setTime(today, 19, 0),
    allDay: false,
    color: "orange",
    location: "FitLife Gym",
    reminders: [],
    createdAt: today.getTime() - 10 * day,
    updatedAt: today.getTime() - 10 * day,
  },

  // Tomorrow's events
  {
    id: generateId(),
    title: "Dentist appointment",
    startAt: setTime(new Date(today.getTime() + day), 10, 0),
    endAt: setTime(new Date(today.getTime() + day), 11, 0),
    allDay: false,
    color: "red",
    location: "Dr. Schmidt Dental",
    reminders: [{ id: "r5", minutesBefore: 1440, type: "notification" }],
    createdAt: today.getTime() - 14 * day,
    updatedAt: today.getTime() - 14 * day,
  },
  {
    id: generateId(),
    title: "Birthday - Mom",
    startAt: new Date(today.getTime() + day).setHours(0, 0, 0, 0),
    endAt: new Date(today.getTime() + day).setHours(23, 59, 59, 999),
    allDay: true,
    color: "pink",
    reminders: [{ id: "r6", minutesBefore: 1440, type: "notification" }],
    createdAt: today.getTime() - 30 * day,
    updatedAt: today.getTime() - 30 * day,
  },

  // This week
  {
    id: generateId(),
    title: "Weekly planning",
    description: "Plan priorities for the upcoming week",
    startAt: setTime(new Date(today.getTime() + 2 * day), 9, 0),
    endAt: setTime(new Date(today.getTime() + 2 * day), 10, 0),
    allDay: false,
    color: "blue",
    reminders: [],
    createdAt: today.getTime() - 7 * day,
    updatedAt: today.getTime() - 7 * day,
  },
  {
    id: generateId(),
    title: "Client call - Acme Corp",
    description: "Discuss new project requirements",
    startAt: setTime(new Date(today.getTime() + 3 * day), 15, 0),
    endAt: setTime(new Date(today.getTime() + 3 * day), 16, 0),
    allDay: false,
    color: "teal",
    reminders: [
      { id: "r7", minutesBefore: 15, type: "notification" },
    ],
    createdAt: today.getTime() - 5 * day,
    updatedAt: today.getTime() - 2 * day,
  },
  {
    id: generateId(),
    title: "Team offsite",
    description: "Quarterly team building event",
    startAt: setTime(new Date(today.getTime() + 5 * day), 10, 0),
    endAt: setTime(new Date(today.getTime() + 5 * day), 18, 0),
    allDay: false,
    color: "purple",
    location: "Mountain View Conference Center",
    reminders: [
      { id: "r8", minutesBefore: 1440, type: "notification" },
    ],
    createdAt: today.getTime() - 21 * day,
    updatedAt: today.getTime() - 7 * day,
  },

  // Recurring event example (just showing one instance)
  {
    id: generateId(),
    title: "Weekly review",
    description: "Review tasks and plan next week",
    startAt: setTime(new Date(today.getTime() + 6 * day), 16, 0),
    endAt: setTime(new Date(today.getTime() + 6 * day), 17, 0),
    allDay: false,
    color: "yellow",
    recurring: {
      frequency: "weekly",
      interval: 1,
      daysOfWeek: [5], // Friday
    },
    reminders: [{ id: "r9", minutesBefore: 60, type: "notification" }],
    createdAt: today.getTime() - 60 * day,
    updatedAt: today.getTime() - 14 * day,
  },
];

// ============================================
// Date Utilities
// ============================================

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

export function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function startOfWeek(d: Date, weekStartsOn: number = 1): Date {
  // weekStartsOn: 0 = Sunday, 1 = Monday
  const date = startOfDay(d);
  const day = date.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  date.setDate(date.getDate() - diff);
  return date;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

export function addWeeks(d: Date, weeks: number): Date {
  return addDays(d, weeks * 7);
}

export function addMonths(d: Date, months: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("de-AT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(d: Date): string {
  return d.toLocaleDateString("de-AT", {
    weekday: "short",
    day: "numeric",
  });
}

export function formatDateFull(d: Date): string {
  return d.toLocaleDateString("de-AT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatMonthYear(d: Date): string {
  const formatted = d.toLocaleDateString("de-AT", {
    month: "long",
    year: "numeric",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function getMonthDays(monthStart: Date): Date[] {
  const result: Date[] = [];
  const current = new Date(monthStart);
  
  while (current.getMonth() === monthStart.getMonth()) {
    result.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return result;
}

// ============================================
// Event Utilities
// ============================================

export function getEventColor(color?: EventColor): {
  bg: string;
  text: string;
  border: string;
} {
  const found = EVENT_COLORS.find((c) => c.value === color);
  if (found) {
    return {
      bg: found.bg,
      text: found.text,
      border: found.bg.replace("/20", "/40"),
    };
  }
  return {
    bg: "bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "bg-blue-500/40",
  };
}

export function getEventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const dayStart = startOfDay(date).getTime();
  const dayEnd = endOfDay(date).getTime();
  
  return events.filter(
    (event) => event.startAt <= dayEnd && event.endAt >= dayStart
  ).sort((a, b) => {
    // All-day events first, then by start time
    if (a.allDay && !b.allDay) return -1;
    if (!a.allDay && b.allDay) return 1;
    return a.startAt - b.startAt;
  });
}

export function getEventsForWeek(events: CalendarEvent[], weekStart: Date): Map<string, CalendarEvent[]> {
  const result = new Map<string, CalendarEvent[]>();
  const days = getWeekDays(weekStart);
  
  for (const day of days) {
    const key = day.toISOString().split("T")[0];
    result.set(key, getEventsForDay(events, day));
  }
  
  return result;
}

export function getEventDuration(event: CalendarEvent): number {
  return event.endAt - event.startAt;
}

export function formatEventDuration(event: CalendarEvent): string {
  if (event.allDay) return "All day";
  
  const durationMs = getEventDuration(event);
  const hours = Math.floor(durationMs / hour);
  const minutes = Math.floor((durationMs % hour) / (60 * 1000));
  
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

export function getUpcomingEvents(
  events: CalendarEvent[],
  count: number = 5,
  fromDate: Date = new Date()
): CalendarEvent[] {
  const fromTime = fromDate.getTime();
  
  return events
    .filter((e) => e.startAt >= fromTime)
    .sort((a, b) => a.startAt - b.startAt)
    .slice(0, count);
}

export function createEmptyEvent(startDate: Date): Partial<CalendarEvent> {
  const start = new Date(startDate);
  start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
  
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  
  return {
    title: "",
    startAt: start.getTime(),
    endAt: end.getTime(),
    allDay: false,
    color: "blue",
    reminders: [{ id: `r_${Date.now()}`, minutesBefore: 15, type: "notification" }],
  };
}
