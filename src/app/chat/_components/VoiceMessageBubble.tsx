"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface VoiceMessageBubbleProps {
  audioUrl: string;
  durationMs: number;
  transcription?: string | null;
  isUser?: boolean;
  timestamp?: string;
}

// ============================================
// Simple Waveform Visualization
// ============================================

function StaticWaveform({
  progress,
  isPlaying,
}: {
  progress: number;
  isPlaying: boolean;
}) {
  // Generate deterministic "random" bars for visual effect
  const bars = [0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.4, 0.7, 0.5, 0.8, 0.6, 0.9, 0.5, 0.7, 0.4, 0.6, 0.8, 0.5, 0.7, 0.9, 0.4, 0.6, 0.8, 0.5];

  return (
    <div className="flex h-8 items-center gap-[2px]">
      {bars.map((height, i) => {
        const barProgress = i / bars.length;
        const isActive = barProgress <= progress;

        return (
          <div
            key={i}
            className={cn(
              "w-[3px] rounded-full transition-all duration-150",
              isActive
                ? isPlaying
                  ? "bg-indigo-500 dark:bg-indigo-400"
                  : "bg-indigo-400 dark:bg-indigo-500"
                : "bg-zinc-300 dark:bg-zinc-600"
            )}
            style={{
              height: `${height * 100}%`,
              transform: isPlaying && isActive ? "scaleY(1.1)" : "scaleY(1)",
            }}
          />
        );
      })}
    </div>
  );
}

// ============================================
// Format Duration
// ============================================

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// ============================================
// Main VoiceMessageBubble Component
// ============================================

export function VoiceMessageBubble({
  audioUrl,
  durationMs,
  transcription,
  isUser = true,
  timestamp,
}: VoiceMessageBubbleProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showTranscription, setShowTranscription] = useState(false);

  // Handle play/pause
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }, [isPlaying]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };
    const handleTimeUpdate = () => {
      const duration = audio.duration || durationMs / 1000;
      setProgress(audio.currentTime / duration);
      setCurrentTime(audio.currentTime * 1000);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [durationMs]);

  // Click on waveform to seek
  const handleWaveformClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      if (!audio) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const duration = audio.duration || durationMs / 1000;
      audio.currentTime = percentage * duration;
    },
    [durationMs]
  );

  const displayDuration = isPlaying ? currentTime : durationMs;

  return (
    <div className={cn("max-w-[280px] sm:max-w-[320px]", isUser && "ml-auto")}>
      {/* Main bubble */}
      <div
        className={cn(
          "rounded-2xl px-3 py-2",
          isUser
            ? "bg-indigo-500 text-white"
            : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
        )}
      >
        {/* Audio player row */}
        <div className="flex items-center gap-3">
          {/* Play/Pause button */}
          <button
            type="button"
            onClick={togglePlay}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
              isUser
                ? "bg-white/20 hover:bg-white/30"
                : "bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30"
            )}
          >
            {isPlaying ? (
              <Pause
                className={cn(
                  "h-5 w-5",
                  isUser ? "text-white" : "text-indigo-600 dark:text-indigo-400"
                )}
              />
            ) : (
              <Play
                className={cn(
                  "h-5 w-5 ml-0.5",
                  isUser ? "text-white" : "text-indigo-600 dark:text-indigo-400"
                )}
              />
            )}
          </button>

          {/* Waveform */}
          <div
            className="flex-1 cursor-pointer"
            onClick={handleWaveformClick}
          >
            <StaticWaveform progress={progress} isPlaying={isPlaying} />
          </div>

          {/* Duration */}
          <span
            className={cn(
              "shrink-0 font-mono text-xs tabular-nums",
              isUser ? "text-white/80" : "text-zinc-500 dark:text-zinc-400"
            )}
          >
            {formatDuration(displayDuration)}
          </span>
        </div>

        {/* Hidden audio element */}
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
      </div>

      {/* Transcription toggle (if available) */}
      {transcription && (
        <div className={cn("mt-1", isUser ? "text-right" : "text-left")}>
          <button
            type="button"
            onClick={() => setShowTranscription(!showTranscription)}
            className={cn(
              "inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400",
              "hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            )}
          >
            {showTranscription ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Hide transcript
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Show transcript
              </>
            )}
          </button>

          {/* Transcription text */}
          {showTranscription && (
            <div
              className={cn(
                "mt-1 rounded-lg px-3 py-2 text-sm",
                isUser
                  ? "bg-indigo-50 dark:bg-indigo-950/30 text-zinc-700 dark:text-zinc-300"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              )}
            >
              {transcription}
            </div>
          )}
        </div>
      )}

      {/* Timestamp */}
      {timestamp && (
        <div
          className={cn(
            "mt-1 text-[10px] text-zinc-400 dark:text-zinc-500",
            isUser ? "text-right" : "text-left"
          )}
        >
          {timestamp}
        </div>
      )}
    </div>
  );
}
