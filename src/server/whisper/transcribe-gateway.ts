/**
 * Gateway Whisper transcription
 * 
 * Calls the OpenClaw Gateway's whisper-http-server for transcription.
 * Works on Vercel serverless - no local dependencies needed.
 */

export type GatewayWhisperConfig = {
  language?: string; // ISO-639-1 code (e.g., "de", "en") or "auto"
};

/**
 * Get the Gateway whisper endpoint URL
 * 
 * The whisper server is exposed via Tailscale funnel at /whisper path.
 * Local dev: http://127.0.0.1:8082/transcribe
 * Production: https://mac-mini.ts.net/whisper/transcribe
 */
function getWhisperUrl(): string {
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_HTTP_URL;
  if (!gatewayUrl) {
    throw new Error("OPENCLAW_GATEWAY_HTTP_URL not configured");
  }
  
  const url = new URL(gatewayUrl);
  
  // Check if using local development (localhost or 127.0.0.1)
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    // Local dev: whisper server runs on port 8082
    const whisperPort = process.env.OPENCLAW_WHISPER_PORT || "8082";
    return `http://${url.hostname}:${whisperPort}/transcribe`;
  }
  
  // Production: whisper server is at /whisper path via Tailscale funnel
  return `${url.origin}/whisper/transcribe`;
}

/**
 * Get the Gateway auth token
 */
function getAuthToken(): string {
  return process.env.OPENCLAW_GATEWAY_PASSWORD || "";
}

/**
 * Transcribe audio using the Gateway's whisper-http-server
 * 
 * @param audioBuffer - Audio data as Buffer
 * @param mimeType - MIME type of the audio (e.g., "audio/webm")
 * @param cfg - Configuration options
 * @returns Transcription text or null on failure
 */
export async function transcribeViaGateway(
  audioBuffer: Buffer,
  mimeType: string,
  cfg: GatewayWhisperConfig = {},
): Promise<string | null> {
  const authToken = getAuthToken();
  
  if (!authToken) {
    console.error("OPENCLAW_GATEWAY_PASSWORD not set - cannot transcribe");
    return null;
  }

  let whisperUrl: string;
  try {
    whisperUrl = getWhisperUrl();
  } catch (err) {
    console.error("Gateway whisper URL error:", err);
    return null;
  }

  const language = cfg.language ?? "auto";
  const url = `${whisperUrl}?language=${encodeURIComponent(language)}`;

  // Determine file extension from mime type
  const extMap: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "audio/m4a": "m4a",
    "audio/mp4": "m4a",
  };
  const ext = extMap[mimeType] ?? "webm";
  const filename = `audio.${ext}`;

  // Build multipart form data
  const formData = new FormData();
  const uint8Array = new Uint8Array(audioBuffer);
  formData.append("audio", new Blob([uint8Array], { type: mimeType }), filename);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gateway whisper error:", response.status, errorText);
      return null;
    }

    const data = await response.json() as { ok: boolean; text?: string; error?: string };
    
    if (!data.ok) {
      console.error("Gateway whisper error:", data.error);
      return null;
    }

    return data.text?.trim() || null;
  } catch (err) {
    console.error("Gateway whisper request failed:", err);
    return null;
  }
}
