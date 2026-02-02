"use client";

import Link from "next/link";
import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { AppShell } from "./_ui/AppShell";

export function HomeView() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dieter HQ</h1>
            <p className="mt-1 text-default-500">
              Chat-first homebase (PWA). Telegram replacement once stable.
            </p>
          </div>
          <Chip color="primary" variant="flat">
            MVP
          </Chip>
        </div>

        <div className="mt-8 grid gap-4">
          <Link href="/chat">
            <Card isPressable isHoverable className="w-full">
              <CardHeader className="pb-0">
                <div className="text-base font-semibold">Chat</div>
              </CardHeader>
              <CardBody>
                <div className="text-sm text-default-500">
                  Threads + artefacts + actions
                </div>
              </CardBody>
            </Card>
          </Link>

          <Link href="/kanban">
            <Card isPressable isHoverable className="w-full">
              <CardHeader className="pb-0">
                <div className="text-base font-semibold">Kanban</div>
              </CardHeader>
              <CardBody>
                <div className="text-sm text-default-500">
                  Inbox + planning + logic
                </div>
              </CardBody>
            </Card>
          </Link>

          <Link href="/calendar">
            <Card isPressable isHoverable className="w-full">
              <CardHeader className="pb-0">
                <div className="text-base font-semibold">Calendar</div>
              </CardHeader>
              <CardBody>
                <div className="text-sm text-default-500">
                  Agenda + upcoming
                </div>
              </CardBody>
            </Card>
          </Link>

          <Link href="/events">
            <Card isPressable isHoverable className="w-full">
              <CardHeader className="pb-0">
                <div className="text-base font-semibold">Events</div>
              </CardHeader>
              <CardBody>
                <div className="text-sm text-default-500">Internal log</div>
              </CardBody>
            </Card>
          </Link>
        </div>

        <p className="mt-10 text-xs text-default-400">
          Note: scaffold. Next step is real-time chat + agents panel.
        </p>
      </div>
    </AppShell>
  );
}
