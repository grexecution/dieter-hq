import { useRef, useCallback, useEffect, useState } from "react";

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  enabled?: boolean;
}

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  isDragging: boolean;
  direction: "left" | "right" | null;
}

export function useSwipeGesture<T extends HTMLElement>({
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  enabled = true,
}: SwipeGestureOptions) {
  const ref = useRef<T>(null);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    isDragging: false,
    direction: null,
  });

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      const touch = e.touches[0];
      setSwipeState({
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        isDragging: true,
        direction: null,
      });
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !swipeState.isDragging) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - swipeState.startX;
      const deltaY = Math.abs(touch.clientY - swipeState.startY);

      // If vertical scrolling, ignore horizontal swipe
      if (deltaY > Math.abs(deltaX)) {
        setSwipeState((prev) => ({ ...prev, isDragging: false }));
        return;
      }

      // Prevent page scroll when swiping horizontally
      e.preventDefault();

      setSwipeState((prev) => ({
        ...prev,
        currentX: touch.clientX,
        direction: deltaX < 0 ? "left" : deltaX > 0 ? "right" : null,
      }));
    },
    [enabled, swipeState.isDragging, swipeState.startX, swipeState.startY]
  );

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !swipeState.isDragging) return;

    const deltaX = swipeState.currentX - swipeState.startX;

    if (Math.abs(deltaX) >= threshold) {
      if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      }
    }

    setSwipeState({
      startX: 0,
      startY: 0,
      currentX: 0,
      isDragging: false,
      direction: null,
    });
  }, [enabled, swipeState, threshold, onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd);
    element.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const offset = swipeState.isDragging
    ? swipeState.currentX - swipeState.startX
    : 0;

  return {
    ref,
    offset,
    isDragging: swipeState.isDragging,
    direction: swipeState.direction,
  };
}
