import { useEffect, useCallback } from "react";

interface KeyboardNavigationOptions {
  items: { id: string }[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onAction?: (key: string, item: { id: string }) => void;
  enabled?: boolean;
}

const ACTION_KEYS: Record<string, string> = {
  e: "archive",
  r: "reply",
  s: "snooze",
  Enter: "open",
  Escape: "close",
};

export function useKeyboardNavigation({
  items,
  selectedIndex,
  onSelectIndex,
  onAction,
  enabled = true,
}: KeyboardNavigationOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Navigation: j/k or arrow keys
      if (key === "j" || key === "arrowdown") {
        e.preventDefault();
        const newIndex = Math.min(selectedIndex + 1, items.length - 1);
        onSelectIndex(newIndex);
        return;
      }

      if (key === "k" || key === "arrowup") {
        e.preventDefault();
        const newIndex = Math.max(selectedIndex - 1, 0);
        onSelectIndex(newIndex);
        return;
      }

      // Actions
      if (onAction && items[selectedIndex]) {
        const action = ACTION_KEYS[key] || ACTION_KEYS[e.key];
        if (action) {
          e.preventDefault();
          onAction(action, items[selectedIndex]);
        }
      }
    },
    [enabled, items, selectedIndex, onSelectIndex, onAction]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    selectedIndex,
  };
}
