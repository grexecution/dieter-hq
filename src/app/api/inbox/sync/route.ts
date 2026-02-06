import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxSyncState } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

type SyncSource = "email" | "whatsapp";

type SyncPayload = {
  source: SyncSource;
  account?: string; // For email: the account to sync
};

// Stub functions for sync - will be implemented with gog/wacli CLIs
async function syncEmailInbox(account: string): Promise<{ synced: number; errors: string[] }> {
  // TODO: Implement using gog CLI
  // Command: gog gmail list --account=<account> --unread --json
  console.log(`[Sync] Email sync triggered for account: ${account}`);
  
  return {
    synced: 0,
    errors: ["Email sync not yet implemented - will use gog CLI"],
  };
}

async function syncWhatsAppInbox(): Promise<{ synced: number; errors: string[] }> {
  // TODO: Implement using wacli CLI
  // Command: wacli messages list --unread --json
  console.log("[Sync] WhatsApp sync triggered");
  
  return {
    synced: 0,
    errors: ["WhatsApp sync not yet implemented - will use wacli CLI"],
  };
}

// POST /api/inbox/sync - Trigger sync for a source
export async function POST(req: NextRequest) {
  let body: SyncPayload;
  try {
    body = (await req.json()) as SyncPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 }
    );
  }
  
  if (!body.source) {
    return NextResponse.json(
      { ok: false, error: "missing_source" },
      { status: 400 }
    );
  }
  
  const now = new Date();
  let result: { synced: number; errors: string[] };
  
  try {
    switch (body.source) {
      case "email":
        if (!body.account) {
          return NextResponse.json(
            { ok: false, error: "email_requires_account" },
            { status: 400 }
          );
        }
        result = await syncEmailInbox(body.account);
        break;
        
      case "whatsapp":
        result = await syncWhatsAppInbox();
        break;
        
      default:
        return NextResponse.json(
          { ok: false, error: "unsupported_source" },
          { status: 400 }
        );
    }
    
    // Update sync state
    const syncId = body.account ? `${body.source}:${body.account}` : body.source;
    
    await db
      .insert(inboxSyncState)
      .values({
        id: syncId,
        source: body.source,
        account: body.account || null,
        lastSyncAt: now,
        metadata: JSON.stringify({ 
          synced: result.synced, 
          errors: result.errors,
        }),
      })
      .onConflictDoUpdate({
        target: inboxSyncState.id,
        set: {
          lastSyncAt: now,
          metadata: JSON.stringify({ 
            synced: result.synced, 
            errors: result.errors,
          }),
        },
      });
    
    return NextResponse.json({
      ok: true,
      source: body.source,
      account: body.account,
      synced: result.synced,
      errors: result.errors,
      syncedAt: now.toISOString(),
    });
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json(
      { ok: false, error: "sync_failed" },
      { status: 500 }
    );
  }
}

// GET /api/inbox/sync - Get sync status for all sources
export async function GET() {
  try {
    const states = await db.select().from(inboxSyncState);
    
    return NextResponse.json({
      ok: true,
      syncStates: states.map(s => ({
        id: s.id,
        source: s.source,
        account: s.account,
        lastSyncAt: s.lastSyncAt?.toISOString() || null,
        metadata: s.metadata ? JSON.parse(s.metadata) : null,
      })),
    });
  } catch (err) {
    console.error("Error fetching sync states:", err);
    return NextResponse.json(
      { ok: false, error: "database_error" },
      { status: 500 }
    );
  }
}
