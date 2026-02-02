"use client";

import { AppShell } from "../_ui/AppShell";
import { Card, CardBody, CardHeader, Code } from "@heroui/react";

export type EventRow = {
  id: string;
  threadId: string;
  type: string;
  payloadJson: string;
  createdAt: number | Date;
};

export function EventsView({ rows }: { rows: EventRow[] }) {
  return (
    <AppShell active="events">
      <Card shadow="sm">
        <CardHeader className="flex flex-col items-start gap-1">
          <div className="text-xl font-semibold tracking-tight">Event log</div>
          <div className="text-sm text-default-500">
            Internal log placeholder (DB table <Code>events</Code>). Not yet a
            user-facing audit log.
          </div>
        </CardHeader>
        <CardBody className="gap-2">
          {rows.length ? (
            rows.map((e) => (
              <Card key={e.id} shadow="none" className="border">
                <CardHeader className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="text-sm font-semibold">{e.type}</div>
                  <div className="text-xs text-default-400">
                    {new Date(e.createdAt).toLocaleString()}
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <div className="text-xs text-default-500">
                    thread: <span className="font-mono">{e.threadId}</span>
                  </div>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-medium bg-default-100 p-2 text-xs">
                    {e.payloadJson}
                  </pre>
                </CardBody>
              </Card>
            ))
          ) : (
            <div className="rounded-medium border p-6 text-sm text-default-500">
              No events yet.
            </div>
          )}
        </CardBody>
      </Card>
    </AppShell>
  );
}
