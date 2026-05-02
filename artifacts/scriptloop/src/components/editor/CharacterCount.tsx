import { cn } from "@/lib/utils";

interface CharacterCountProps {
  count: number;
  max: number;
  warnAt?: number;
  className?: string;
}

export function CharacterCount({
  count,
  max,
  warnAt = 1900,
  className,
}: CharacterCountProps) {
  const isWarning = count > warnAt;
  const isOver = count > max;

  return (
    <p
      className={cn(
        "text-xs tabular-nums",
        isOver || isWarning ? "text-destructive font-medium" : "text-muted-foreground",
        className,
      )}
      aria-live="polite"
    >
      {count.toLocaleString()} / {max.toLocaleString()} characters
      {isOver && " — too long"}
    </p>
  );
}
