"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import { AppShell } from "../_ui/AppShell";

export function KanbanView() {
  return (
    <AppShell active="kanban">
      <Card shadow="sm">
        <CardHeader className="flex flex-col items-start gap-1">
          <div className="text-xl font-semibold tracking-tight">Kanban</div>
          <div className="text-sm text-default-500">
            Placeholder. Next: Inbox + areas + planning + ClickUp ingestion logic.
          </div>
        </CardHeader>
        <CardBody>
          <div className="text-sm text-default-500">
            Soon: unified inbox, quick capture, weekly planning.
          </div>
        </CardBody>
      </Card>
    </AppShell>
  );
}
