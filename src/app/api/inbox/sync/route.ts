import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxSyncState } from "@/server/db/schema";
import {
  SyncRequestSchema,
  apiSuccess,
  apiError,
  ErrorCodes,
} from "@/server/inbox/validation";
import { syncEmailInbox, syncAllEmailInboxes, syncWhatsAppInbox, syncSlackInbox, EMAIL_ACCOUNTS } from "@/server/inbox";
import type { SyncResult } from "@/server/inbox";

export const runtime = "nodejs";
export const maxDuration = 120; // Allow up to 2 minutes for sync

const CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, must-revalidate",
};

// POST /api/inbox/sync - Trigger sync for a source
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      apiError(ErrorCodes.INVALID_JSON, "Request body must be valid JSON"),
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  const result = SyncRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      apiError(ErrorCodes.VALIDATION_ERROR, "Invalid request body", result.error.flatten()),
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  const { source, account } = result.data;
  const now = new Date();
  const startTime = Date.now();
  const results: SyncResult[] = [];

  try {
    switch (source) {
      case "email":
        if (account) {
          // Sync specific account
          if (!EMAIL_ACCOUNTS.includes(account as typeof EMAIL_ACCOUNTS[number])) {
            return NextResponse.json(
              apiError(ErrorCodes.VALIDATION_ERROR, "Invalid account", { validAccounts: EMAIL_ACCOUNTS }),
              { status: 400, headers: CACHE_HEADERS }
            );
          }
          const emailResult = await syncEmailInbox(account);
          results.push(emailResult);
        } else {
          // Sync all email accounts
          const emailResults = await syncAllEmailInboxes();
          results.push(...emailResults);
        }
        break;

      case "whatsapp":
        const waResult = await syncWhatsAppInbox();
        results.push(waResult);
        break;

      case "slack":
        const slackResult = await syncSlackInbox();
        results.push(slackResult);
        break;

      case "all":
        // Sync everything
        console.log("[Sync] Syncing all sources...");
        
        // Sync all emails
        const allEmailResults = await syncAllEmailInboxes();
        results.push(...allEmailResults);
        
        // Sync WhatsApp
        const allWaResult = await syncWhatsAppInbox();
        results.push(allWaResult);
        
        // Sync Slack
        const allSlackResult = await syncSlackInbox();
        results.push(allSlackResult);
        break;
    }

    // Aggregate stats
    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
    const allErrors = results.flatMap(r => r.errors);
    const durationMs = Date.now() - startTime;

    console.log(`[Sync] Completed in ${durationMs}ms: ${totalSynced} synced, ${totalSkipped} skipped, ${allErrors.length} errors`);

    return NextResponse.json(
      apiSuccess({
        source,
        account: account || null,
        results,
        summary: {
          totalSynced,
          totalSkipped,
          errorCount: allErrors.length,
          durationMs,
        },
        errors: allErrors.length > 0 ? allErrors : undefined,
        syncedAt: now.toISOString(),
      }),
      { headers: CACHE_HEADERS }
    );
  } catch (err) {
    console.error("[inbox/sync] POST error:", err);
    return NextResponse.json(
      apiError(ErrorCodes.DATABASE_ERROR, "Sync failed", { message: (err as Error).message }),
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

// GET /api/inbox/sync - Get sync status for all sources
export async function GET() {
  try {
    const states = await db.select().from(inboxSyncState);

    // Group by source
    const emailStates = states.filter(s => s.source === "email");
    const whatsappState = states.find(s => s.source === "whatsapp");

    return NextResponse.json(
      apiSuccess({
        syncStates: {
          email: {
            accounts: EMAIL_ACCOUNTS,
            states: emailStates.map(s => ({
              account: s.account,
              lastSyncAt: s.lastSyncAt?.toISOString() || null,
              metadata: s.metadata ? JSON.parse(s.metadata) : null,
            })),
          },
          whatsapp: {
            lastSyncAt: whatsappState?.lastSyncAt?.toISOString() || null,
            metadata: whatsappState?.metadata ? JSON.parse(whatsappState.metadata) : null,
          },
        },
        raw: states.map(s => ({
          id: s.id,
          source: s.source,
          account: s.account,
          lastSyncAt: s.lastSyncAt?.toISOString() || null,
          metadata: s.metadata ? JSON.parse(s.metadata) : null,
        })),
      }),
      { headers: CACHE_HEADERS }
    );
  } catch (err) {
    console.error("[inbox/sync] GET error:", err);
    return NextResponse.json(
      apiError(ErrorCodes.DATABASE_ERROR, "Failed to fetch sync states"),
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}
