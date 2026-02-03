import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

export type WhisperConfig = {
  bin?: string; // default: "whisper" (openai-whisper CLI)
  model?: string; // default: "base"
  language?: string; // optional (e.g. "de")
};

function run(cmd: string, args: string[]): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += String(d)));
    child.stderr.on("data", (d) => (stderr += String(d)));
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    child.on("error", () => resolve({ code: -1, stdout, stderr: stderr || "spawn_error" }));
  });
}

export async function transcribeLocalWhisper(
  absAudioPath: string,
  cfg: WhisperConfig = {},
): Promise<string | null> {
  const bin = cfg.bin ?? process.env.WHISPER_BIN ?? "whisper";
  const model = cfg.model ?? process.env.WHISPER_MODEL ?? "base";
  const language = cfg.language ?? process.env.WHISPER_LANG;

  // whisper writes <basename>.txt into output_dir.
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "hq-whisper-"));
  const baseName = path.basename(absAudioPath);
  const outTxt = path.join(outDir, `${baseName}.txt`);

  const args = [
    absAudioPath,
    "--model",
    model,
    "--output_dir",
    outDir,
    "--output_format",
    "txt",
    "--fp16",
    "False",
  ];
  if (language) args.push("--language", language);

  const res = await run(bin, args);
  if (res.code !== 0) {
    // best effort cleanup
    try {
      await fs.rm(outDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
    return null;
  }

  try {
    const txt = await fs.readFile(outTxt, "utf8");
    const cleaned = txt.trim();
    return cleaned || null;
  } catch {
    return null;
  } finally {
    try {
      await fs.rm(outDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
