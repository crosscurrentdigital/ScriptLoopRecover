import { useCallback, useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useWordHiding,
  type HideStrategy,
  type Token,
} from "@/hooks/useWordHiding";
import {
  preferencesToCssVars,
  type ReadingPreferences,
} from "@/lib/reading-preferences";

export interface ProgressiveTextProps {
  text: string;
  loopCount: number;
  hideStrategy?: HideStrategy;
  className?: string;
  showPeekButton?: boolean;
  /**
   * When provided, applies these reading preferences as inline CSS
   * variables on the surface, overriding the user-level globals set on
   * `:root`. Used by per-script overrides on the Script Detail page.
   */
  preferencesOverride?: ReadingPreferences | null;
}

const PLACEHOLDER_CHAR = "▢";

function HiddenWord({ token, peek }: { token: Token; peek: boolean }) {
  const placeholder = PLACEHOLDER_CHAR.repeat(Math.max(1, token.length));
  return (
    <span
      aria-hidden={!peek}
      className={cn(
        "inline-block align-baseline transition-[opacity,transform] duration-200 ease-out",
        peek
          ? "opacity-100 scale-100 text-foreground"
          : "opacity-60 scale-95 text-muted-foreground/70 select-none",
      )}
      style={{ minWidth: `${token.length}ch` }}
    >
      {peek ? (
        <span className="sr-only">{token.text}</span>
      ) : (
        <span className="sr-only">hidden word</span>
      )}
      <span aria-hidden="true">{peek ? token.text : placeholder}</span>
    </span>
  );
}

function VisibleWord({ token }: { token: Token }) {
  return (
    <span className="inline-block align-baseline transition-[opacity,transform] duration-200 ease-out opacity-100 scale-100">
      {token.text}
    </span>
  );
}

export function ProgressiveText({
  text,
  loopCount,
  hideStrategy = "random",
  className,
  showPeekButton = true,
  preferencesOverride,
}: ProgressiveTextProps) {
  const { tokens, hiddenCount, wordCount, hidePercent } = useWordHiding({
    text,
    loopCount,
    hideStrategy,
  });

  const [peek, setPeek] = useState(false);
  const peekRef = useRef(peek);
  peekRef.current = peek;

  const startPeek = useCallback(() => setPeek(true), []);
  const endPeek = useCallback(() => setPeek(false), []);

  useEffect(() => {
    if (!peek) return;
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") endPeek();
    };
    const handleBlur = () => endPeek();
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [peek, endPeek]);

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className="reading-surface whitespace-pre-wrap rounded-md border p-4"
        data-testid="progressive-text"
        style={
          preferencesOverride
            ? (preferencesToCssVars(
                preferencesOverride,
              ) as React.CSSProperties)
            : undefined
        }
      >
        {tokens.length === 0 ? (
          <span className="text-muted-foreground">(empty)</span>
        ) : (
          tokens.map((token, i) => {
            if (token.type === "gap") {
              return <span key={i}>{token.text}</span>;
            }
            if (token.hidden && !peek) {
              return <HiddenWord key={i} token={token} peek={false} />;
            }
            if (token.hidden && peek) {
              return <HiddenWord key={i} token={token} peek={true} />;
            }
            return <VisibleWord key={i} token={token} />;
          })
        )}
      </div>

      {showPeekButton && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="sm"
            variant={peek ? "default" : "outline"}
            aria-label="Hold to reveal hidden words"
            aria-pressed={peek}
            onPointerDown={(e) => {
              e.preventDefault();
              startPeek();
            }}
            onPointerUp={endPeek}
            onPointerLeave={endPeek}
            onPointerCancel={endPeek}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                if (!peekRef.current) startPeek();
              }
            }}
            onBlur={endPeek}
          >
            <Eye className="h-4 w-4" />
            {peek ? "Revealing…" : "Peek"}
          </Button>
          <span
            className="text-xs text-muted-foreground"
            aria-live="polite"
          >
            {wordCount === 0
              ? "Nothing to memorize yet."
              : hiddenCount === 0
                ? "All words visible. Hiding starts after the first loop."
                : `${hiddenCount} of ${wordCount} words hidden (${Math.round(
                    hidePercent * 100,
                  )}%).`}
          </span>
        </div>
      )}
    </div>
  );
}
