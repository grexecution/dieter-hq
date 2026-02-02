import { db } from "../db";
import { events } from "../db/schema";

export async function logEvent(params: {
  threadId: string;
  type: string;
  payload: unknown;
}) {
  const now = new Date();
  await db.insert(events).values({
    id: crypto.randomUUID(),
    threadId: params.threadId,
    type: params.type,
    payloadJson: JSON.stringify(params.payload ?? null),
    createdAt: now,
  });
}
