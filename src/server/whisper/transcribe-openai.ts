/**
 * OpenAI Whisper API transcription
 * 
 * Works on Vercel serverless - no filesystem or local CLI needed.
 */

export type OpenAIWhisperConfig = {
  language?: string; // ISO-639-1 code (e.g., "de", "en") or undefined for auto-detect
  model?: string; // default: "whisper-1"
};

/**
 * Transcribe audio using OpenAI Whisper API
 * 
 * @param audioBuffer - Audio data as Buffer
 * @param mimeType - MIME type of the audio (e.g., "audio/webm")
 * @param cfg - Configuration options
 * @returns Transcription text or null on failure
 */
export async function transcribeOpenAIWhisper(
  audioBuffer: Buffer,
  mimeType: string,
  cfg: OpenAIWhisperConfig = {},
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error("OPENAI_API_KEY not set - cannot transcribe");
    return null;
  }

  const model = cfg.model ?? "whisper-1";

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
  formData.append("file", new Blob([uint8Array], { type: mimeType }), filename);
  formData.append("model", model);
  
  if (cfg.language && cfg.language !== "auto") {
    formData.append("language", cfg.language);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI Whisper API error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    const text = data.text?.trim();
    
    return text || null;
  } catch (err) {
    console.error("OpenAI Whisper API request failed:", err);
    return null;
  }
}
