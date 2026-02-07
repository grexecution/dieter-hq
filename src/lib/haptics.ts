/**
 * Haptic Feedback Utilities
 * 
 * Provides tactile feedback for user interactions.
 * Uses Vibration API on Android, AudioContext trick on iOS.
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

// Vibration patterns in milliseconds
const VIBRATION_PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],      // double tap
  warning: [20, 30, 20, 30],   // rapid double
  error: [50, 100, 50],        // strong double
  selection: 5,                // very light
};

// Check if vibration is supported
const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

// iOS Audio Context trick for haptic-like feedback
let audioContext: AudioContext | null = null;

function initAudioContext() {
  if (typeof window !== 'undefined' && !audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

// iOS haptic via AudioContext (creates a subtle "click")
function iosHaptic(style: HapticStyle) {
  const ctx = initAudioContext();
  if (!ctx) return;
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  // Different frequencies for different feedback types
  const frequencies: Record<HapticStyle, number> = {
    light: 150,
    medium: 100,
    heavy: 50,
    success: 200,
    warning: 80,
    error: 60,
    selection: 180,
  };
  
  const durations: Record<HapticStyle, number> = {
    light: 0.01,
    medium: 0.02,
    heavy: 0.03,
    success: 0.015,
    warning: 0.025,
    error: 0.04,
    selection: 0.008,
  };
  
  oscillator.frequency.value = frequencies[style];
  oscillator.type = 'sine';
  
  // Very quiet - just enough to trigger haptic engine
  gainNode.gain.value = 0.001;
  
  const now = ctx.currentTime;
  oscillator.start(now);
  oscillator.stop(now + durations[style]);
}

// Check if we're on iOS
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Trigger haptic feedback
 * @param style - Type of haptic feedback
 */
export function haptic(style: HapticStyle = 'light'): void {
  // Don't run on server
  if (typeof window === 'undefined') return;
  
  // Prefer native vibration API (Android)
  if (canVibrate) {
    const pattern = VIBRATION_PATTERNS[style];
    navigator.vibrate(pattern);
    return;
  }
  
  // iOS fallback (may not work on all devices)
  if (isIOS()) {
    iosHaptic(style);
  }
}

/**
 * Trigger haptic on button/element click
 * Use as onClick handler wrapper
 */
export function withHaptic<T extends (...args: unknown[]) => unknown>(
  fn: T,
  style: HapticStyle = 'light'
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>) => {
    haptic(style);
    return fn(...args) as ReturnType<T>;
  };
}

/**
 * React hook-friendly haptic trigger
 */
export const Haptics = {
  light: () => haptic('light'),
  medium: () => haptic('medium'),
  heavy: () => haptic('heavy'),
  success: () => haptic('success'),
  warning: () => haptic('warning'),
  error: () => haptic('error'),
  selection: () => haptic('selection'),
  
  // Convenience method for impact feedback
  impact: (style: 'light' | 'medium' | 'heavy' = 'medium') => haptic(style),
  
  // For notifications
  notification: (type: 'success' | 'warning' | 'error' = 'success') => haptic(type),
};

export default Haptics;
