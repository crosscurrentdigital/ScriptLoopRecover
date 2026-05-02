import { Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ZenControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  gapSeconds: number;
  onGapChange: (next: number) => void;
  loopCount: number;
  onExit: () => void;
  visible: boolean;
}

const GAP_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function ZenControls({
  isPlaying,
  onTogglePlay,
  gapSeconds,
  onGapChange,
  loopCount,
  onExit,
  visible,
}: ZenControlsProps) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      role="toolbar"
      aria-label="Zen Mode controls"
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/60 px-4 py-2 text-white shadow-2xl backdrop-blur-md">
        <Button
          size="icon"
          variant="ghost"
          onClick={onTogglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="h-10 w-10 rounded-full text-white hover:bg-white/10 hover:text-white"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>

        <div className="flex items-center gap-2 text-xs text-white/70">
          <span className="hidden sm:inline">Gap</span>
          <Select
            value={String(gapSeconds)}
            onValueChange={(v) => onGapChange(Number(v))}
          >
            <SelectTrigger
              className="h-8 w-[72px] border-white/20 bg-transparent text-white"
              aria-label="Loop gap in seconds"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GAP_OPTIONS.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}s
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          className="text-xs tabular-nums text-white/70"
          aria-label={`${loopCount} loops`}
        >
          loops <span className="font-medium text-white">{loopCount}</span>
        </div>

        <div className="mx-1 h-6 w-px bg-white/15" aria-hidden />

        <Button
          size="sm"
          variant="ghost"
          onClick={onExit}
          className="rounded-full text-white/80 hover:bg-white/10 hover:text-white"
          aria-label="Exit Zen Mode"
        >
          <X className="mr-1 h-4 w-4" />
          Exit
        </Button>
      </div>
    </div>
  );
}
