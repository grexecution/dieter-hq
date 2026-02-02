"use client";

import Link from "next/link";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
} from "@heroui/react";

export function AppShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: "chat" | "kanban" | "calendar" | "events";
}) {
  return (
    <div className="min-h-dvh">
      <Navbar maxWidth="xl" isBordered>
        <NavbarBrand>
          <Link href="/" className="font-semibold tracking-tight">
            Dieter HQ
          </Link>
        </NavbarBrand>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button
              as={Link}
              href="/chat"
              size="sm"
              variant={active === "chat" ? "solid" : "flat"}
              color={active === "chat" ? "primary" : "default"}
            >
              Chat
            </Button>
          </NavbarItem>
          <NavbarItem>
            <Button
              as={Link}
              href="/kanban"
              size="sm"
              variant={active === "kanban" ? "solid" : "flat"}
              color={active === "kanban" ? "primary" : "default"}
            >
              Kanban
            </Button>
          </NavbarItem>
          <NavbarItem>
            <Button
              as={Link}
              href="/calendar"
              size="sm"
              variant={active === "calendar" ? "solid" : "flat"}
              color={active === "calendar" ? "primary" : "default"}
            >
              Calendar
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
