"use client";

import * as React from "react";
import { useEffect, useCallback, useState } from "react";
import { 
  CheckCircle2, 
  FileBarChart2, 
  Send, 
  Trash2,
  AlertCircle,
  X 
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Confetti Component
// ============================================

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
}

function Confetti({ show }: { show: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (show) {
      const colors = [
        "#6366f1", // indigo
        "#8b5cf6", // purple
        "#ec4899", // pink
        "#f59e0b", // amber
        "#10b981", // emerald
        "#3b82f6", // blue
      ];
      
      const newPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360,
      }));
      
      setPieces(newPieces);
      
      // Clear after animation
      const timer = setTimeout(() => setPieces([]), 2500);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!show || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0 animate-confetti"
          style={{
            left: `${piece.x}%`,
            animationDelay: `${piece.delay}s`,
            transform: `rotate(${piece.rotation}deg)`,
          }}
        >
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: piece.color }}
          />
        </div>
      ))}
      
      {/* Add CSS animation via style tag */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti-fall 2.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// ============================================
// Success Pulse Animation
// ============================================

function SuccessPulse() {
  return (
    <div className="relative">
      <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />
      <div className="relative flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      </div>
    </div>
  );
}

// ============================================
// Toast Types
// ============================================

type ToastType = "success" | "error" | "info" | "warning";

interface ToastConfig {
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  showConfetti?: boolean;
}

// ============================================
// Toast Component
// ============================================

interface ReportToastProps extends ToastConfig {
  onClose: () => void;
}

export function ReportToast({
  type,
  title,
  description,
  duration = 5000,
  showConfetti = false,
  onClose,
}: ReportToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(hideTimer);
  }, [duration, onClose]);

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(onClose, 300);
  }, [onClose]);

  const icons = {
    success: <SuccessPulse />,
    error: (
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/50">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
      </div>
    ),
    warning: (
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      </div>
    ),
    info: (
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50">
        <FileBarChart2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      </div>
    ),
  };

  const bgColors = {
    success: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800",
    error: "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800",
    warning: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
    info: "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800",
  };

  return (
    <>
      <Confetti show={showConfetti && type === "success"} />
      
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "flex items-start gap-4 p-4 rounded-2xl border shadow-lg",
          "min-w-[320px] max-w-[420px]",
          "transition-all duration-300 ease-out",
          bgColors[type],
          isLeaving
            ? "opacity-0 translate-y-2 scale-95"
            : "opacity-100 translate-y-0 scale-100",
          "animate-in slide-in-from-bottom-4 fade-in"
        )}
      >
        {icons[type]}
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h4>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>

        <button
          onClick={handleClose}
          className={cn(
            "flex items-center justify-center h-6 w-6 rounded-full",
            "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
            "hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50",
            "transition-colors"
          )}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-4 right-4 h-1 bg-zinc-200/50 dark:bg-zinc-700/50 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              type === "success" && "bg-emerald-500",
              type === "error" && "bg-red-500",
              type === "warning" && "bg-amber-500",
              type === "info" && "bg-indigo-500"
            )}
            style={{
              animation: `shrink ${duration}ms linear forwards`,
            }}
          />
        </div>

        <style jsx>{`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
      </div>
    </>
  );
}

// ============================================
// Toast Hook & Context
// ============================================

interface ToastContextValue {
  showToast: (config: ToastConfig) => void;
  hideToast: () => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ReportToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastConfig | null>(null);

  const showToast = useCallback((config: ToastConfig) => {
    setToast(config);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && <ReportToast {...toast} onClose={hideToast} />}
    </ToastContext.Provider>
  );
}

export function useReportToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useReportToast must be used within a ReportToastProvider");
  }
  return context;
}

// ============================================
// Preset Toast Functions
// ============================================

export function createReportToasts(showToast: (config: ToastConfig) => void) {
  return {
    reportCreated: (title: string) => showToast({
      type: "success",
      title: "Report erstellt! 🎉",
      description: `"${title}" wurde erfolgreich erstellt.`,
      showConfetti: true,
      duration: 4000,
    }),
    
    reportPublished: (title: string) => showToast({
      type: "success",
      title: "Report veröffentlicht! 🚀",
      description: `"${title}" ist jetzt für alle sichtbar.`,
      showConfetti: true,
      duration: 5000,
    }),
    
    reportSaved: () => showToast({
      type: "success",
      title: "Gespeichert",
      description: "Deine Änderungen wurden gespeichert.",
      duration: 3000,
    }),
    
    reportDeleted: (title: string) => showToast({
      type: "info",
      title: "Report gelöscht",
      description: `"${title}" wurde entfernt.`,
      duration: 4000,
    }),
    
    reportError: (message: string) => showToast({
      type: "error",
      title: "Fehler",
      description: message,
      duration: 6000,
    }),
  };
}

export default ReportToast;
