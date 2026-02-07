"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Haptics } from "@/lib/haptics";

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
  onVoiceMessage?: (message: VoiceMessageData) => void | Promise<void>;
  onTranscriptionStart?: () => void;
  onTranscriptionEnd?: () => void;
  threadId: string;
  disabled?: boolean;
}

type RecordingState = "idle" | "recording" | "transcribing";

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
    <span className="font-mono text-xs tabular-nums text-red-500">
      {minutes}:{displaySeconds.toString().padStart(2, "0")}
    </span>
  );
}

// ============================================
// Main VoiceRecorder Component (Tap to Record)
// ============================================

export function VoiceRecorder({ onTranscript, onVoiceMessage, onTranscriptionStart, onTranscriptionEnd, threadId, disabled }: VoiceRecorderProps) {
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

  // Check if running as iOS PWA (standalone mode)
  const isIOSPWA = useCallback(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    return isIOS && isStandalone;
  }, []);

  // Start recording (tap to start)
  const startRecording = useCallback(async () => {
    console.log("[VoiceRecorder] startRecording called, disabled:", disabled, "state:", state);
    
    if (disabled) {
      console.log("[VoiceRecorder] Blocked: disabled=true");
      return;
    }
    if (state !== "idle") {
      console.log("[VoiceRecorder] Blocked: state is not idle, state=", state);
      return;
    }

    // Check if mediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Mikrofon wird auf diesem Gerät/Browser nicht unterstützt.");
      return;
    }

    try {
      console.log("[VoiceRecorder] Requesting microphone access...");
      
      // On iOS PWA, we need to handle permission differently
      if (isIOSPWA()) {
        console.log("[VoiceRecorder] Detected iOS PWA mode");
      }
      
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
      console.error("[VoiceRecorder] Failed to start recording:", err);
      // Show user-friendly error
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "NotReadableError") {
          if (isIOSPWA()) {
            // iOS PWA specific message
            alert(
              "🎤 Mikrofon-Zugriff in PWA nicht verfügbar.\n\n" +
              "Lösung für iOS:\n" +
              "1. Diese Seite in Safari öffnen (nicht in der App)\n" +
              "2. Mikrofon dort erlauben\n" +
              "3. App vom Home-Bildschirm löschen\n" +
              "4. In Safari: Teilen → Zum Home-Bildschirm\n\n" +
              "Oder: Sprachnachricht direkt in Safari aufnehmen."
            );
          } else {
            alert("Mikrofon-Zugriff verweigert. Bitte in Browser-Einstellungen erlauben.");
          }
        } else if (err.name === "NotFoundError") {
          alert("Kein Mikrofon gefunden.");
        } else {
          alert(`Aufnahme fehlgeschlagen: ${err.message}`);
        }
      }
      cleanup();
    }
  }, [disabled, state, cleanup, isIOSPWA]);

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
      setState("transcribing");
      onTranscriptionStart?.();

      try {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const formData = new FormData();
        formData.append("audio", blob, `voice-${Date.now()}.webm`);
        formData.append("threadId", threadId);
        formData.append("durationMs", String(duration));

        // Send as voice message (includes synchronous transcription)
        console.log("[VoiceRecorder] Sending to /api/chat/voice-message...");
        const response = await fetch("/api/chat/voice-message", {
          method: "POST",
          body: formData,
        });

        console.log("[VoiceRecorder] Response:", response.status, response.ok);

        if (response.ok) {
          const data = await response.json();
          console.log("[VoiceRecorder] Data:", { ok: data.ok, hasMessage: !!data.message, transcription: data.message?.transcription?.slice(0, 50) });
          if (data.ok && data.message && onVoiceMessage) {
            console.log("[VoiceRecorder] Calling onVoiceMessage (await)...");
            await onVoiceMessage(data.message);
            console.log("[VoiceRecorder] onVoiceMessage completed");
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
        onTranscriptionEnd?.();
        cleanup();
        setState("idle");
      }
    };

    recorder.stop();
  }, [state, startTime, threadId, onTranscript, onVoiceMessage, onTranscriptionStart, onTranscriptionEnd, cleanup, cancelRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const isRecording = state === "recording";
  const isTranscribing = state === "transcribing";

  // Recording UI - inline bar instead of fullscreen overlay
  if (isRecording) {
    return (
      <div className="flex items-center gap-1.5 rounded-xl bg-red-50 px-2 py-1 dark:bg-red-950/30">
        {/* Waveform */}
        <WaveformBars analyser={analyser} />
        
        {/* Timer */}
        <RecordingTimer startTime={startTime} />
        
        {/* Cancel button */}
        <button
          type="button"
          onClick={() => {
            Haptics.light();
            cancelRecording();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600"
          title="Abbrechen"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        
        {/* Send button */}
        <button
          type="button"
          onClick={() => {
            Haptics.success();
            sendRecording();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500 text-white transition-colors hover:bg-indigo-600"
          title="Senden"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // Transcribing state - show disabled mic (status is shown in chat area via callback)
  if (isTranscribing) {
    return (
      <button
        type="button"
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200",
          "bg-indigo-100/80 dark:bg-indigo-900/30 backdrop-blur-sm",
          "text-indigo-500 dark:text-indigo-400",
          "ring-1 ring-indigo-200/50 dark:ring-indigo-700/50"
        )}
        disabled
        title="Transkribiere..."
      >
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
      </button>
    );
  }

  // Idle state - just the mic button
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("[VoiceRecorder] Mic button clicked, disabled:", disabled);
        if (!disabled) {
          Haptics.medium(); // Haptic feedback on record start
          startRecording();
        }
      }}
      className={cn(
        "relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200",
        "bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-sm",
        "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
        "ring-1 ring-zinc-200/50 dark:ring-zinc-700/50",
        "hover:ring-zinc-300 dark:hover:ring-zinc-600 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80",
        "touch-manipulation select-none cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      disabled={disabled}
      title="Sprachaufnahme"
      aria-label="Sprachaufnahme starten"
    >
      <Mic className="h-[18px] w-[18px] pointer-events-none" />
    </button>
  );
}
