export const dynamic = "force-dynamic";

import { db } from "@/server/db";
import { events } from "@/server/db/schema";
import { desc } from "drizzle-orm";
import { EventsView } from "./EventsView";

export default async function EventsPage() {
  const rows = await db
    .select()
    .from(events)
    .orderBy(desc(events.createdAt))
    .limit(200);

  return <EventsView rows={rows} />;
}
