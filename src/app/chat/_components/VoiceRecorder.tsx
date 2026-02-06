"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

export interface VoiceMessageData {
  id: string;
  threadId: string;
  role: "user";
  content: string;
  audioUrl: string;
  audioDurationMs: number;
  transcription: string | null;
  createdAt: number;
  createdAtLabel: string;
}

interface VoiceRecorderProps {
  onTranscript?: (transcript: string) => void;
  onVoiceMessage?: (message: VoiceMessageData) => void;
  threadId: string;
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
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += dataArray[i * step + j];
        }
        const avg = sum / step;
        const barHeight = Math.max(4, (avg / 255) * (canvas.height - 8));

        const x = i * (barWidth + barGap);
        const y = centerY - barHeight / 2;

        ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
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
      height={32}
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
// Main VoiceRecorder Component (Tap to Record)
// ============================================

export function VoiceRecorder({ onTranscript, onVoiceMessage, threadId, disabled }: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [startTime, setStartTime] = useState<number>(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

  // Start recording (tap to start)
  const startRecording = useCallback(async () => {
    if (disabled || state !== "idle") return;

    try {
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

      mediaRecorder.start(100);
      setState("recording");
      setStartTime(Date.now());
    } catch (err) {
      console.error("Failed to start recording:", err);
      cleanup();
    }
  }, [disabled, state, cleanup]);

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (state !== "recording" || !mediaRecorderRef.current) return;
    
    mediaRecorderRef.current.onstop = () => {
      cleanup();
      setState("idle");
    };
    mediaRecorderRef.current.stop();
  }, [state, cleanup]);

  // Send recording
  const sendRecording = useCallback(async () => {
    if (state !== "recording" || !mediaRecorderRef.current) return;

    const recorder = mediaRecorderRef.current;
    const duration = Date.now() - startTime;

    // Minimum recording duration: 500ms
    if (duration < 500) {
      cancelRecording();
      return;
    }

    recorder.onstop = async () => {
      setState("uploading");

      try {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const formData = new FormData();
        formData.append("audio", blob, `voice-${Date.now()}.webm`);
        formData.append("threadId", threadId);
        formData.append("durationMs", String(duration));

        // Send as voice message
        const response = await fetch("/api/chat/voice-message", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.message && onVoiceMessage) {
            onVoiceMessage(data.message);
          }
        } else {
          // Fallback: Try old transcript API
          const fallbackForm = new FormData();
          fallbackForm.append("audio", blob, `voice-${Date.now()}.webm`);
          const fallbackRes = await fetch("/api/chat/voice", {
            method: "POST",
            body: fallbackForm,
          });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            if (fallbackData.transcript && onTranscript) {
              onTranscript(fallbackData.transcript);
            }
          }
        }
      } catch (err) {
        console.error("Failed to upload voice:", err);
      } finally {
        cleanup();
        setState("idle");
      }
    };

    recorder.stop();
  }, [state, startTime, threadId, onTranscript, onVoiceMessage, cleanup, cancelRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const isRecording = state === "recording";
  const isUploading = state === "uploading";

  // Recording UI - inline bar instead of fullscreen overlay
  if (isRecording) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 dark:bg-red-950/30">
        {/* Waveform */}
        <WaveformBars analyser={analyser} />
        
        {/* Timer */}
        <RecordingTimer startTime={startTime} />
        
        {/* Cancel button */}
        <button
          type="button"
          onClick={cancelRecording}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600"
          title="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
        
        {/* Send button */}
        <button
          type="button"
          onClick={sendRecording}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white transition-colors hover:bg-indigo-600"
          title="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Idle / Uploading state - just the mic button
  return (
    <button
      type="button"
      onClick={startRecording}
      className={cn(
        "relative flex h-11 w-11 items-center justify-center rounded-full transition-all",
        isUploading
          ? "bg-zinc-200 text-zinc-500 dark:bg-zinc-700"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
      )}
      disabled={disabled || isUploading}
      title={isUploading ? "Processing..." : "Tap to record"}
    >
      {isUploading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </button>
  );
}
