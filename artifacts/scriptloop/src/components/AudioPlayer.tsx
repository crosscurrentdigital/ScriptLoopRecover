import { useEffect, useRef } from "react";
import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLoopedAudio } from "@/hooks/useLoopedAudio";

export interface AudioPlayerProps {
  audioUrl?: string;
  src?: string;
  initialGapSeconds?: number;
  gapSeconds?: number;
  defaultLooping?: boolean;
  onLoopComplete?: (loopNumber: number) => void;
}

const STANDARD_GAPS = [0, 2, 5, 10] as const;

function buildGapOptions(current: number): number[] {
  if (STANDARD_GAPS.includes(current as (typeof STANDARD_GAPS)[number])) {
    return [...STANDARD_GAPS];
  }
  return [...STANDARD_GAPS, current].sort((a, b) => a - b);
}

export function AudioPlayer({
  audioUrl,
  src,
  initialGapSeconds,
  gapSeconds,
  defaultLooping = false,
  onLoopComplete,
}: AudioPlayerProps) {
  const url = audioUrl ?? src ?? "";

  const {
    audioRef,
    isPlaying,
    loopCount,
    gapSeconds: gap,
    play,
    pause,
    stop,
    setGapSeconds,
  } = useLoopedAudio({
    audioUrl: url,
    initialGapSeconds: initialGapSeconds ?? gapSeconds,
    onLoopComplete,
  });

  const didAutoStart = useRef(false);
  useEffect(() => {
    didAutoStart.current = false;
  }, [url]);
  useEffect(() => {
    if (!defaultLooping || didAutoStart.current || !url) return;
    didAutoStart.current = true;
    play();
  }, [defaultLooping, url, play]);

  const options = buildGapOptions(gap);

  return (
    <div className="space-y-3 rounded-md border p-3">
      <audio
        ref={audioRef}
        src={url}
        preload="auto"
        controls
        className="w-full"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={isPlaying ? pause : play}
          aria-label={isPlaying ? "Pause" : "Play"}
          aria-pressed={isPlaying}
          disabled={!url}
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Play
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={stop}
          aria-label="Stop"
          disabled={!url}
        >
          <Square className="h-4 w-4" />
          Stop
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Gap</span>
          <Select
            value={String(gap)}
            onValueChange={(v) => setGapSeconds(Number(v))}
          >
            <SelectTrigger
              className="w-[88px]"
              aria-label="Loop gap in seconds"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}s
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          className="ml-auto text-sm tabular-nums text-muted-foreground"
          aria-live="polite"
          aria-label={`Loop ${loopCount}`}
        >
          Loop{" "}
          <span className="font-medium text-foreground">{loopCount}</span>
        </div>
      </div>
    </div>
  );
}
