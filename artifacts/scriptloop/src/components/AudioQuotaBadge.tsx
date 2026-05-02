import { useEffect, useState } from "react";
import { useAudioQuota } from "@/lib/api";

function formatResetIn(resetsAtIso: string): string {
  const ms = new Date(resetsAtIso).getTime() - Date.now();
  if (ms <= 0) return "now";
  const minutes = Math.ceil(ms / 60_000);
  if (minutes >= 60) {
    const hours = Math.ceil(minutes / 60);
    return `${hours}h`;
  }
  return `${minutes}m`;
}

interface AudioQuotaBadgeProps {
  className?: string;
}

/**
 * Shows the user's remaining hourly audio generations. Renders nothing
 * while loading or on error so it never blocks the UI.
 *
 * Re-renders once a minute when the quota is exhausted so the "resets in"
 * countdown stays accurate without needing a network round-trip.
 */
export function AudioQuotaBadge({ className }: AudioQuotaBadgeProps) {
  const { data, isLoading, error } = useAudioQuota();
  const [, force] = useState(0);

  const exhausted = data ? data.used >= data.limit : false;

  useEffect(() => {
    if (!exhausted) return;
    const id = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [exhausted]);

  if (isLoading || error || !data) return null;

  const remaining = Math.max(0, data.limit - data.used);
  const low = !exhausted && remaining <= 3;

  const tone = exhausted
    ? "text-destructive"
    : low
      ? "text-amber-600 dark:text-amber-400"
      : "text-muted-foreground";

  const message = exhausted
    ? `Hourly limit reached — resets in ${formatResetIn(data.resetsAt)}`
    : `${remaining} / ${data.limit} generations left this hour`;

  return (
    <p
      className={`text-xs tabular-nums ${tone}${className ? ` ${className}` : ""}`}
      aria-live="polite"
      data-testid="audio-quota-badge"
    >
      {message}
    </p>
  );
}

export default AudioQuotaBadge;
