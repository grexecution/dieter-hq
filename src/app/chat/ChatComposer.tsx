"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function ChatComposer({ threadId }: { threadId: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const fd = new FormData();
        fd.set("threadId", threadId);
        fd.set("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error(`Upload failed (${res.status})`);
        // No router refresh: messages come in via SSE.
      } finally {
        setIsUploading(false);
      }
    },
    [threadId],
  );

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) await uploadFile(file);
    },
    [uploadFile],
  );

  const onPaste = useCallback(
    async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const fileItem = Array.from(items).find((i) => i.kind === "file");
      const file = fileItem?.getAsFile();
      if (file) {
        e.preventDefault();
        await uploadFile(file);
      }
    },
    [uploadFile],
  );

  useEffect(() => {
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onPaste]);

  return (
    <div
      className="mt-4 rounded-xl border border-zinc-200 bg-white/50 p-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Drag & drop or paste an image/file here.
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? "Uploading…" : "Upload"}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await uploadFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
