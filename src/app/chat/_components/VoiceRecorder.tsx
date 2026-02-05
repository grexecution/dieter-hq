"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface VoiceRecorderProps {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
}

type RecordingState = "idle" | "recording" | "uploading";

// ============================================
// Waveform Visualization Component
// ============================================

function WaveformBars({ analyser }: { analyser: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const barCount = 24;
    const barWidth = 3;
    const barGap = 2;

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const step = Math.floor(bufferLength / barCount);
      const centerY = canvas.height / 2;

      for (let i = 0; i < barCount; i++) {
        // Average a few frequency bins
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += dataArray[i * step + j];
        }
        const avg = sum / step;
        const barHeight = Math.max(4, (avg / 255) * (canvas.height - 8));

        const x = i * (barWidth + barGap);
        const y = centerY - barHeight / 2;

        ctx.fillStyle = "rgba(239, 68, 68, 0.9)"; // red-500
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 1.5);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [analyser]);

  return (
    <canvas
      ref={canvasRef}
      width={24 * 5}
      height={40}
      className="opacity-90"
    />
  );
}

// ============================================
// Timer Display
// ============================================

function RecordingTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);
    return () => clearInterval(interval);
  }, [startTime]);

  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;

  return (
    <span className="font-mono text-sm tabular-nums text-red-500">
      {minutes}:{displaySeconds.toString().padStart(2, "0")}
    </span>
  );
}

// ============================================
// Main VoiceRecorder Component
// ============================================

export function VoiceRecorder({ onTranscript, disabled }: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [startTime, setStartTime] = useState<number>(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [cancelled, setCancelled] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startYRef = useRef<number>(0);
  const isTouchRef = useRef(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    mediaRecorderRef.current = null;
    setAnalyser(null);
    chunksRef.current = [];
  }, []);

  // Start recording
  const startRecording = useCallback(async (clientY: number) => {
    if (disabled || state !== "idle") return;

    try {
      startYRef.current = clientY;
      setCancelled(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      streamRef.current = stream;

      // Set up Web Audio API for waveform
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      setAnalyser(analyserNode);

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setState("recording");
      setStartTime(Date.now());
    } catch (err) {
      console.error("Failed to start recording:", err);
      cleanup();
    }
  }, [disabled, state, cleanup]);

  // Stop recording and send
  const stopRecording = useCallback(async (wasCancelled: boolean) => {
    if (state !== "recording" || !mediaRecorderRef.current) return;

    const recorder = mediaRecorderRef.current;

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        if (wasCancelled) {
          cleanup();
          setState("idle");
          resolve();
          return;
        }

        // Minimum recording duration: 500ms
        const duration = Date.now() - startTime;
        if (duration < 500) {
          cleanup();
          setState("idle");
          resolve();
          return;
        }

        setState("uploading");

        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
          const formData = new FormData();
          formData.append("audio", blob, `voice-${Date.now()}.webm`);

          const response = await fetch("/api/chat/voice", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            if (data.transcript) {
              onTranscript(data.transcript);
            }
          }
        } catch (err) {
          console.error("Failed to upload voice:", err);
        } finally {
          cleanup();
          setState("idle");
          resolve();
        }
      };

      recorder.stop();
    });
  }, [state, startTime, onTranscript, cleanup]);

  // Handle swipe up to cancel
  const handleMove = useCallback((clientY: number) => {
    if (state !== "recording") return;

    const deltaY = startYRef.current - clientY;
    if (deltaY > 50) {
      setCancelled(true);
    } else {
      setCancelled(false);
    }
  }, [state]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isTouchRef.current) return; // Prevent mouse events on touch devices
    e.preventDefault();
    startRecording(e.clientY);
  }, [startRecording]);

  const handleMouseUp = useCallback(() => {
    if (isTouchRef.current) return;
    stopRecording(cancelled);
  }, [stopRecording, cancelled]);

  const handleMouseLeave = useCallback(() => {
    if (isTouchRef.current) return;
    if (state === "recording") {
      stopRecording(true); // Cancel if mouse leaves
    }
  }, [state, stopRecording]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleMove(e.clientY);
  }, [handleMove]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isTouchRef.current = true;
    e.preventDefault();
    const touch = e.touches[0];
    startRecording(touch.clientY);
  }, [startRecording]);

  const handleTouchEnd = useCallback(() => {
    stopRecording(cancelled);
  }, [stopRecording, cancelled]);

  const handleTouchCancel = useCallback(() => {
    stopRecording(true);
  }, [stopRecording]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientY);
  }, [handleMove]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const isRecording = state === "recording";
  const isUploading = state === "uploading";

  return (
    <div className="relative">
      {/* Recording overlay */}
      {isRecording && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="mb-32 flex flex-col items-center gap-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
            {/* Cancel indicator */}
            {cancelled ? (
              <div className="flex items-center gap-2 text-red-500">
                <X className="h-5 w-5" />
                <span className="text-sm font-medium">Release to cancel</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                Release to send • Swipe up to cancel
              </span>
            )}

            {/* Waveform */}
            <WaveformBars analyser={analyser} />

            {/* Timer */}
            <RecordingTimer startTime={startTime} />

            {/* Pulsing indicator */}
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-red-500 shadow-lg">
                <Mic className="absolute inset-0 m-auto h-8 w-8 text-white" />
              </div>
              <div className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-30" />
            </div>
          </div>
        </div>
      )}

      {/* Main button */}
      <button
        type="button"
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-full transition-all",
          "touch-none select-none",
          isRecording
            ? "scale-110 bg-red-500 text-white shadow-lg"
            : isUploading
              ? "bg-zinc-200 text-zinc-500 dark:bg-zinc-700"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        )}
        disabled={disabled || isUploading}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onTouchMove={handleTouchMove}
        title={isUploading ? "Processing..." : "Hold to record"}
      >
        {isUploading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
        ) : (
          <Mic className={cn("h-5 w-5", isRecording && "animate-pulse")} />
        )}
      </button>
    </div>
  );
}
