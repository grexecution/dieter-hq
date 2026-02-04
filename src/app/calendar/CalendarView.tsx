"use client";

import * as React from "react";

import { AppShell } from "../_ui/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

type CalendarEventItem = {
  id: string;
  title: string;
  description: string | null;
  startAt: number;
  endAt: number;
  allDay: boolean;
  createdAt: number;
  updatedAt: number;
};

type EventDraft = {
  title: string;
  description: string;
  date: string; // yyyy-mm-dd
  startTime: string; // hh:mm
  endTime: string; // hh:mm
  allDay: boolean;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toDateInputValue(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toTimeInputValue(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function parseDateInput(v: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);
  return new Date(y, mo, da, 0, 0, 0, 0);
}

function parseTimeInput(v: string) {
  const m = /^(\d{2}):(\d{2})$/.exec(v);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return { hh, mm };
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1, 0, 0, 0, 0);
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function startOfWeekMonday(d: Date) {
  // JS: 0=Sun...6=Sat
  const dow = d.getDay();
  const delta = (dow + 6) % 7; // Monday -> 0
  return addDays(startOfDay(d), -delta);
}

function buildDefaultDraft(date: Date): EventDraft {
  const base = startOfDay(date);
  const start = new Date(base);
  start.setHours(9, 0, 0, 0);
  const end = new Date(base);
  end.setHours(10, 0, 0, 0);

  return {
    title: "",
    description: "",
    date: toDateInputValue(base),
    startTime: toTimeInputValue(start),
    endTime: toTimeInputValue(end),
    allDay: false,
  };
}

function draftFromEvent(e: CalendarEventItem): EventDraft {
  const start = new Date(e.startAt);
  const end = new Date(e.endAt);
  return {
    title: e.title,
    description: e.description ?? "",
    date: toDateInputValue(start),
    startTime: toTimeInputValue(start),
    endTime: toTimeInputValue(end),
    allDay: e.allDay,
  };
}

function formatMonthLabel(d: Date) {
  const fmt = new Intl.DateTimeFormat("de-AT", { month: "long", year: "numeric" });
  const label = fmt.format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatTimeBadge(e: CalendarEventItem) {
  if (e.allDay) return "All";
  return new Intl.DateTimeFormat("de-AT", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(e.startAt),
  );
}

export function CalendarView() {
  const [cursor, setCursor] = React.useState(() => startOfMonth(new Date()));
  const [items, setItems] = React.useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CalendarEventItem | null>(null);
  const [draft, setDraft] = React.useState<EventDraft>(() => buildDefaultDraft(new Date()));
  const [error, setError] = React.useState<string | null>(null);

  const gridStart = React.useMemo(() => startOfWeekMonday(startOfMonth(cursor)), [cursor]);
  const days = React.useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)), [gridStart]);

  async function load() {
    setLoading(true);
    try {
      const from = gridStart.getTime();
      const to = endOfDay(addDays(gridStart, 41)).getTime();
      const res = await fetch(`/api/calendar/events?from=${from}&to=${to}`, { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; items?: CalendarEventItem[] };
      if (!json.ok) throw new Error("load_failed");
      setItems((json.items ?? []).slice().sort((a, b) => a.startAt - b.startAt));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridStart.getTime()]);

  function openNew(date: Date) {
    setEditing(null);
    setDraft(buildDefaultDraft(date));
    setError(null);
    setOpen(true);
  }

  function openEdit(e: CalendarEventItem) {
    setEditing(e);
    setDraft(draftFromEvent(e));
    setError(null);
    setOpen(true);
  }

  function eventsForDay(day: Date) {
    const a = startOfDay(day).getTime();
    const b = endOfDay(day).getTime();
    return items.filter((e) => e.startAt <= b && e.endAt >= a);
  }

  async function save() {
    setError(null);

    const title = draft.title.trim();
    if (!title) return setError("Title is required.");

    const date = parseDateInput(draft.date);
    if (!date) return setError("Invalid date.");

    let startAt: number;
    let endAt: number;

    if (draft.allDay) {
      startAt = startOfDay(date).getTime();
      endAt = endOfDay(date).getTime();
    } else {
      const st = parseTimeInput(draft.startTime);
      const et = parseTimeInput(draft.endTime);
      if (!st || !et) return setError("Invalid time.");

      startAt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), st.hh, st.mm, 0, 0).getTime();
      endAt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), et.hh, et.mm, 0, 0).getTime();
      if (endAt < startAt) return setError("End must be after start.");
    }

    const payload = {
      title,
      description: draft.description.trim() ? draft.description.trim() : null,
      startAt,
      endAt,
      allDay: draft.allDay,
    };

    if (!editing) {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok: boolean; item?: CalendarEventItem; error?: string };
      if (!json.ok || !json.item) return setError(json.error ?? "Save failed.");
      setItems((prev) => prev.concat(json.item!).slice().sort((a, b) => a.startAt - b.startAt));
      setOpen(false);
      return;
    }

    const res = await fetch(`/api/calendar/events/${editing.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as { ok: boolean; item?: CalendarEventItem; error?: string };
    if (!json.ok || !json.item) return setError(json.error ?? "Save failed.");

    setItems((prev) => prev.map((p) => (p.id === editing.id ? json.item! : p)).slice().sort((a, b) => a.startAt - b.startAt));
    setOpen(false);
  }

  async function remove() {
    if (!editing) return;
    if (!confirm(`Delete event “${editing.title}”?`)) return;
    await fetch(`/api/calendar/events/${editing.id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((p) => p.id !== editing.id));
    setOpen(false);
  }

  const weekdays = React.useMemo(() => {
    const fmt = new Intl.DateTimeFormat("de-AT", { weekday: "short" });
    const base = startOfWeekMonday(new Date(2026, 0, 5)); // Monday
    return Array.from({ length: 7 }, (_, i) => fmt.format(addDays(base, i)));
  }, []);

  const todayKey = startOfDay(new Date()).getTime();

  return (
    <AppShell active="calendar">
      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">Calendar</CardTitle>
              <CardDescription>Month view • SQLite</CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCursor(startOfMonth(new Date()))}>
                Today
              </Button>

              <div className="flex items-center rounded-md border bg-background">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-none"
                  onClick={() => setCursor((c) => addMonths(c, -1))}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="px-3 text-sm font-medium tabular-nums">{formatMonthLabel(cursor)}</div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-none"
                  onClick={() => setCursor((c) => addMonths(c, 1))}
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button size="sm" onClick={() => openNew(new Date())}>
                <Plus className="mr-2 h-4 w-4" />
                New event
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border">
            {weekdays.map((w) => (
              <div
                key={w}
                className="bg-muted px-2 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                {w}
              </div>
            ))}

            {days.map((day) => {
              const dayKey = startOfDay(day).getTime();
              const isToday = dayKey === todayKey;
              const inMonth = day.getMonth() === cursor.getMonth();

              const dayEvents = eventsForDay(day);
              const shown = dayEvents.slice(0, 3);
              const more = Math.max(0, dayEvents.length - shown.length);

              return (
                <div
                  key={dayKey}
                  className={cn(
                    "relative min-h-[110px] bg-background p-2",
                    !inMonth && "bg-background/60",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => openNew(day)}
                    className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Add event on ${toDateInputValue(day)}`}
                  />

                  <div className="relative flex items-center justify-between">
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold tabular-nums",
                        isToday && "bg-primary text-primary-foreground",
                      )}
                    >
                      {day.getDate()}
                    </div>

                    {loading ? <span className="text-[11px] text-muted-foreground">…</span> : null}
                  </div>

                  <div className="relative mt-2 space-y-1">
                    {shown.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        className="block w-full text-left"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          openEdit(e);
                        }}
                      >
                        <Badge
                          className="w-full justify-start truncate"
                          variant={e.allDay ? "default" : "secondary"}
                          title={e.title}
                        >
                          <span className="mr-2 text-[11px] opacity-80">{formatTimeBadge(e)}</span>
                          <span className="truncate">{e.title}</span>
                        </Badge>
                      </button>
                    ))}

                    {more > 0 ? (
                      <div className="text-[11px] text-muted-foreground">+{more} more</div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            Click a day to create an event; click an event to edit.
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit event" : "New event"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="e.g. Dentist"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                />
              </div>

              <div className="flex items-end gap-2">
                <Checkbox
                  id="allday"
                  checked={draft.allDay}
                  onCheckedChange={(v) => setDraft((d) => ({ ...d, allDay: v === true }))}
                />
                <Label htmlFor="allday">All day</Label>
              </div>
            </div>

            <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", draft.allDay && "opacity-50")}>
              <div className="grid gap-2">
                <Label htmlFor="start">Start</Label>
                <Input
                  id="start"
                  type="time"
                  value={draft.startTime}
                  disabled={draft.allDay}
                  onChange={(e) => setDraft((d) => ({ ...d, startTime: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end">End</Label>
                <Input
                  id="end"
                  type="time"
                  value={draft.endTime}
                  disabled={draft.allDay}
                  onChange={(e) => setDraft((d) => ({ ...d, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="desc">Notes</Label>
              <Textarea
                id="desc"
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                rows={4}
                placeholder="Optional"
              />
            </div>

            {error ? <div className="text-sm text-destructive">{error}</div> : null}
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            {editing ? (
              <Button variant="outline" onClick={remove} className="mr-auto">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
