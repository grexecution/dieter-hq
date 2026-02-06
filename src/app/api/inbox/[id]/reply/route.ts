import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxItems } from "@/server/db/schema";
import { eq } from "drizzle-orm";

// Gateway URL for sending messages
const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_HTTP_URL || "http://localhost:3033";
const GATEWAY_PASSWORD = process.env.OPENCLAW_GATEWAY_PASSWORD || "";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { message } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get the inbox item to find the sender info
    const items = await db
      .select()
      .from(inboxItems)
      .where(eq(inboxItems.id, id))
      .limit(1);

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    const item = items[0];

    // Determine how to send based on source
    if (item.source === "whatsapp") {
      // Send via OpenClaw gateway using wacli
      const response = await fetch(`${GATEWAY_URL}/api/sessions/main/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GATEWAY_PASSWORD}`,
        },
        body: JSON.stringify({
          message: `Sende diese WhatsApp Nachricht an ${item.sender}: "${message}"`,
        }),
      });

      if (!response.ok) {
        console.error("Gateway error:", await response.text());
        return NextResponse.json(
          { error: "Failed to send via gateway" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, method: "gateway" });
    } 
    
    if (item.source === "email") {
      // For email, create a draft via OpenClaw gateway
      const response = await fetch(`${GATEWAY_URL}/api/sessions/main/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GATEWAY_PASSWORD}`,
        },
        body: JSON.stringify({
          message: `Erstelle einen Email-Entwurf an ${item.sender} mit folgendem Inhalt: "${message}"`,
        }),
      });

      if (!response.ok) {
        console.error("Gateway error:", await response.text());
        return NextResponse.json(
          { error: "Failed to create email draft via gateway" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, method: "gateway-email-draft" });
    }

    // For other sources, just return success (TODO: implement)
    return NextResponse.json({ 
      success: true, 
      method: "not-implemented",
      message: `Reply to ${item.source} not yet implemented`
    });

  } catch (error) {
    console.error("Error sending reply:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
