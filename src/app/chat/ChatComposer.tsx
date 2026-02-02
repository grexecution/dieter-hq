"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

export function ChatComposer({ threadId }: { threadId: string }) {
  const router = useRouter();
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
        router.refresh();
      } finally {
        setIsUploading(false);
      }
    },
    [router, threadId],
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
      className="mt-4 rounded-large border border-default-200 bg-content1 p-3"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-default-500">
          Drag & drop or paste an image/file here.
        </div>
        <Button
          type="button"
          size="sm"
          variant="flat"
          onPress={() => inputRef.current?.click()}
          isDisabled={isUploading}
          isLoading={isUploading}
        >
          Upload
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
