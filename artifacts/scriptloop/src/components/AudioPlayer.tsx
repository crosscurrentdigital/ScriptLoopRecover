import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export interface AudioPlayerProps {
  src: string;
  gapSeconds: number;
  onLoopComplete?: () => void;
  defaultLooping?: boolean;
}

export function AudioPlayer({
  src,
  gapSeconds,
  onLoopComplete,
  defaultLooping = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [isLooping, setIsLooping] = useState(defaultLooping);
  const isLoopingRef = useRef(isLooping);
  const onLoopCompleteRef = useRef(onLoopComplete);

  useEffect(() => {
    onLoopCompleteRef.current = onLoopComplete;
  }, [onLoopComplete]);

  useEffect(() => {
    isLoopingRef.current = isLooping;
    if (!isLooping && timer.current !== undefined) {
      window.clearTimeout(timer.current);
      timer.current = undefined;
    }
  }, [isLooping]);

  useEffect(() => {
    setIsLooping(defaultLooping);
  }, [defaultLooping, src]);

  useEffect(() => {
    if (!defaultLooping) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().catch(() => {
      /* autoplay may be blocked by the browser */
    });
  }, [defaultLooping, src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      onLoopCompleteRef.current?.();
      if (!isLoopingRef.current) return;
      timer.current = window.setTimeout(() => {
        timer.current = undefined;
        if (!isLoopingRef.current) return;
        audio.currentTime = 0;
        audio.play().catch(() => {
          /* autoplay may be blocked */
        });
      }, gapSeconds * 1000);
    };

    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
      if (timer.current !== undefined) {
        window.clearTimeout(timer.current);
        timer.current = undefined;
      }
    };
  }, [gapSeconds, src]);

  return (
    <div className="space-y-2 rounded-md border p-3">
      <audio
        ref={audioRef}
        src={src}
        controls
        className="w-full"
        preload="auto"
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={isLooping ? "default" : "outline"}
          onClick={() => setIsLooping((v) => !v)}
        >
          {isLooping ? "Looping ✓" : "Loop"}
        </Button>
        <span className="text-xs text-muted-foreground">
          {isLooping
            ? `Will replay with a ${gapSeconds}s gap`
            : "Toggle to auto-replay"}
        </span>
      </div>
    </div>
  );
}
