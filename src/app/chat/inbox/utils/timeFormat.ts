/**
 * Format a date for display in the inbox
 * Uses German locale with smart relative formatting
 */
export function formatInboxTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Just now (< 1 min)
  if (diffMins < 1) {
    return "Gerade eben";
  }

  // Minutes (< 1 hour)
  if (diffMins < 60) {
    return `vor ${diffMins} Min.`;
  }

  // Hours (< 24 hours and same day)
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString("de-AT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate() && 
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()) {
    return "Gestern";
  }

  // This week (< 7 days)
  if (diffDays < 7) {
    return `vor ${diffDays} Tagen`;
  }

  // This year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("de-AT", {
      day: "numeric",
      month: "short",
    });
  }

  // Older
  return date.toLocaleDateString("de-AT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Group dates by day for history timeline
 */
export function groupByDay<T extends { createdAt: string }>(
  items: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  items.forEach((item) => {
    const date = new Date(item.createdAt);
    const key = getDayLabel(date);

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  });

  return groups;
}

function getDayLabel(date: Date): string {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return "Heute";
  }

  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return "Gestern";
  }

  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 7) {
    return date.toLocaleDateString("de-AT", { weekday: "long" });
  }

  return date.toLocaleDateString("de-AT", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
