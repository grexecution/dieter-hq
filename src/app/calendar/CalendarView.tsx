"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import { AppShell } from "../_ui/AppShell";

export function CalendarView() {
  return (
    <AppShell active="calendar">
      <Card shadow="sm">
        <CardHeader className="flex flex-col items-start gap-1">
          <div className="text-xl font-semibold tracking-tight">Calendar</div>
          <div className="text-sm text-default-500">
            Placeholder. Next: Agenda view + Google Calendar ingest.
          </div>
        </CardHeader>
        <CardBody>
          <div className="text-sm text-default-500">
            Soon: upcoming events, daily agenda, multi-calendar view.
          </div>
        </CardBody>
      </Card>
    </AppShell>
  );
}
