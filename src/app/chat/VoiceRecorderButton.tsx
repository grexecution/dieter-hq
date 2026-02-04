"use client";

import { useEffect, useState } from "react";
import { Mic, Square } from "lucide-react";
import { useReactMediaRecorder } from "react-media-recorder";

import { Button } from "@/components/ui/button";

export function VoiceRecorderButton({
  threadId,
  disabled,
}: {
  threadId: string;
  disabled?: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);

  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } =
    useReactMediaRecorder({ audio: true });

  const isRecording = status === "recording";

  // When recording stops, upload the blob.
  useEffect(() => {
    if (!mediaBlobUrl) return;

    let cancelled = false;
    void (async () => {
      try {
        setIsUploading(true);
        const blob = await (await fetch(mediaBlobUrl)).blob();
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: blob.type || "audio/webm",
        });

        const fd = new FormData();
        fd.set("threadId", threadId);
        fd.set("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error("upload_failed");
      } catch {
        // ignore
      } finally {
        if (!cancelled) {
          setIsUploading(false);
          clearBlobUrl();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clearBlobUrl, mediaBlobUrl, threadId]);

  return (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "secondary"}
      className="h-[44px] w-[44px] px-0"
      onClick={() => {
        if (isRecording) stopRecording();
        else startRecording();
      }}
      disabled={disabled || isUploading}
      title={isRecording ? "Stop recording" : "Record voice"}
    >
      {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
}
