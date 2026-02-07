import { NextResponse } from "next/server";

const MAC_MINI_FUNNEL = "https://mac-mini-von-dieter.tail954ecb.ts.net";
const GATEWAY_PASSWORD = process.env.OPENCLAW_GATEWAY_PASSWORD || "DieterHQ2026!";

export async function POST() {
  try {
    // Call OpenClaw Gateway on Mac mini via Tailscale Funnel
    // This triggers the inbox-sync.sh script
    const response = await fetch(`${MAC_MINI_FUNNEL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GATEWAY_PASSWORD}`,
        "x-openclaw-agent-id": "main",
      },
      body: JSON.stringify({
        model: "openclaw:main",
        messages: [
          {
            role: "user",
            content: `Run the inbox sync script silently and return results as JSON:
\`\`\`bash
/Users/dieter/.openclaw/workspace/scripts/inbox-sync.sh 2>&1
\`\`\`
After running, respond ONLY with a JSON object like: {"ok": true, "whatsapp": 5, "email": 3}`,
          },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(55000), // 55s timeout
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[trigger-sync] Gateway error:", response.status, text);
      return NextResponse.json(
        { ok: false, error: "Gateway error", status: response.status },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Try to parse the JSON response from the agent
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (jsonMatch) {
      try {
        const result = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ ok: true, ...result });
      } catch {
        // Couldn't parse, return raw
      }
    }

    // Fallback: just indicate success
    return NextResponse.json({ 
      ok: true, 
      message: "Sync completed",
      raw: content.slice(0, 200) 
    });
  } catch (error) {
    console.error("[trigger-sync] Error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
