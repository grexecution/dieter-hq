import fs from "node:fs/promises";
import path from "node:path";

export function artefactsBaseDir(): string {
  // Stored outside Next's public folder; served via API.
  return path.resolve(process.cwd(), "data/artefacts");
}

export function artefactRelPath({
  date,
  id,
  ext,
}: {
  date: Date;
  id: string;
  ext: string;
}): string {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return path.join(yyyy + "-" + mm, `${id}.${ext}`);
}

export async function ensureDirForFile(absPath: string) {
  await fs.mkdir(path.dirname(absPath), { recursive: true });
}
