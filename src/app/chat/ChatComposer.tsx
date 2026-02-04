"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import XHRUpload from "@uppy/xhr-upload";

import { Button } from "@/components/ui/button";

export function ChatComposer({ threadId }: { threadId: string }) {
  const [open, setOpen] = useState(false);
  const modalTargetRef = useRef<HTMLDivElement | null>(null);

  const uppy = useMemo(() => {
    const u = new Uppy({
      autoProceed: true,
      restrictions: {
        maxNumberOfFiles: 10,
      },
    });

    u.use(XHRUpload, {
      endpoint: "/api/upload",
      fieldName: "file",
      formData: true,
    });

    return u;
  }, []);

  // Ensure each upload includes threadId.
  useEffect(() => {
    uppy.setMeta({ threadId });
  }, [uppy, threadId]);

  // Clipboard paste -> add file to uppy.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const fileItem = Array.from(items).find((i) => i.kind === "file");
      const file = fileItem?.getAsFile();
      if (!file) return;

      e.preventDefault();
      uppy.addFile({
        name: file.name || "paste",
        type: file.type,
        data: file,
      });
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [uppy]);

  // Mount Dashboard plugin into our modal container when open.
  useEffect(() => {
    if (!open) return;
    const target = modalTargetRef.current;
    if (!target) return;

    // Avoid double-mount.
    const existing = uppy.getPlugin("Dashboard");
    if (!existing) {
      uppy.use(Dashboard, {
        target,
        inline: true,
        proudlyDisplayPoweredByUppy: false,
        // showProgressDetails not supported in this version
        note: "Drop files here or paste images",
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (existing as any).setOptions({ target, inline: true });
    }

    return () => {
      // Keep plugin mounted; just hide modal.
    };
  }, [open, uppy]);

  // Clean up
  useEffect(() => {
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (uppy as any).close?.({ reason: "unmount" });
    };
  }, [uppy]);

  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white/50 p-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        Drag & drop, paste, or attach files.
      </div>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Attach
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border bg-background p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold">Upload</div>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
            <div ref={modalTargetRef} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
