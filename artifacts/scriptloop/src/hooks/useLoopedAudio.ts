import { useCallback, useEffect, useRef, useState } from "react";

export interface UseLoopedAudioOptions {
  src: string;
  gapSeconds: number;
}

export interface UseLoopedAudioResult {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  toggle: () => void;
  loopCount: number;
}

export function useLoopedAudio({
  src,
  gapSeconds,
}: UseLoopedAudioOptions): UseLoopedAudioResult {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const [loopCount, setLoopCount] = useState(0);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      audio.pause();
      if (timer.current !== undefined) {
        window.clearTimeout(timer.current);
        timer.current = undefined;
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    setLoopCount(0);
    setIsPlaying(false);
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setLoopCount((c) => c + 1);
      if (!isPlayingRef.current) return;
      timer.current = window.setTimeout(() => {
        timer.current = undefined;
        if (!isPlayingRef.current) return;
        audio.currentTime = 0;
        audio.play().catch(() => {
          setIsPlaying(false);
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
  }, [src, gapSeconds]);

  useEffect(() => {
    return () => {
      if (timer.current !== undefined) {
        window.clearTimeout(timer.current);
        timer.current = undefined;
      }
      const audio = audioRef.current;
      if (audio) audio.pause();
    };
  }, []);

  const toggle = useCallback(() => setIsPlaying((p) => !p), []);

  return { audioRef, isPlaying, toggle, loopCount };
}
