import { useCallback, useEffect, useRef, useState } from "react";

export interface UseLoopedAudioOptions {
  audioUrl?: string;
  src?: string;
  initialGapSeconds?: number;
  gapSeconds?: number;
  onLoopComplete?: (loopNumber: number) => void;
}

export interface UseLoopedAudioResult {
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  loopCount: number;
  gapSeconds: number;
  play: () => void;
  pause: () => void;
  stop: () => void;
  toggle: () => void;
  setGapSeconds: (next: number) => void;
}

export function useLoopedAudio(
  options: UseLoopedAudioOptions,
): UseLoopedAudioResult {
  const audioUrl = options.audioUrl ?? options.src ?? "";
  const initialGap = options.initialGapSeconds ?? options.gapSeconds ?? 2;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const internalAudioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  const [gapSeconds, setGapSecondsState] = useState(initialGap);

  const isPlayingRef = useRef(false);
  const gapRef = useRef(initialGap);
  const loopRef = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const urlRef = useRef(audioUrl);
  const onLoopCompleteRef = useRef(options.onLoopComplete);

  useEffect(() => {
    onLoopCompleteRef.current = options.onLoopComplete;
  }, [options.onLoopComplete]);

  useEffect(() => {
    gapRef.current = gapSeconds;
  }, [gapSeconds]);

  const controlledGap = options.gapSeconds;
  useEffect(() => {
    if (controlledGap === undefined) return;
    gapRef.current = controlledGap;
    setGapSecondsState(controlledGap);
  }, [controlledGap]);

  useEffect(() => {
    urlRef.current = audioUrl;
    const el = internalAudioRef.current;
    if (el && audioUrl && el.src !== audioUrl) {
      el.src = audioUrl;
    }
  }, [audioUrl]);

  const getAudio = useCallback((): HTMLAudioElement | null => {
    if (audioRef.current) return audioRef.current;
    if (typeof window === "undefined") return null;
    if (!internalAudioRef.current) {
      const el = new Audio();
      el.preload = "auto";
      if (urlRef.current) el.src = urlRef.current;
      internalAudioRef.current = el;
    } else if (
      urlRef.current &&
      internalAudioRef.current.src !== urlRef.current
    ) {
      internalAudioRef.current.src = urlRef.current;
    }
    return internalAudioRef.current;
  }, []);

  useEffect(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    loopRef.current = 0;
    setLoopCount(0);
    if (timer.current !== undefined) {
      window.clearTimeout(timer.current);
      timer.current = undefined;
    }
  }, [audioUrl]);

  const clearTimer = useCallback(() => {
    if (timer.current !== undefined) {
      window.clearTimeout(timer.current);
      timer.current = undefined;
    }
  }, []);

  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;

    const handleEnded = () => {
      if (!isPlayingRef.current) return;

      const gapMs = Math.max(0, gapRef.current) * 1000;
      timer.current = window.setTimeout(() => {
        timer.current = undefined;
        if (!isPlayingRef.current) return;
        const a = getAudio();
        if (!a) return;
        try {
          a.currentTime = 0;
        } catch {
          /* readyState may not allow seek yet */
        }
        a.play()
          .then(() => {
            const next = loopRef.current + 1;
            loopRef.current = next;
            setLoopCount(next);
            onLoopCompleteRef.current?.(next);
          })
          .catch(() => {
            isPlayingRef.current = false;
            setIsPlaying(false);
          });
      }, gapMs);
    };

    const handlePlay = () => {
      if (!isPlayingRef.current) {
        isPlayingRef.current = true;
        setIsPlaying(true);
      }
    };

    const handlePause = () => {
      if (timer.current !== undefined) return;
      if (isPlayingRef.current) {
        isPlayingRef.current = false;
        setIsPlaying(false);
      }
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [getAudio, audioUrl]);

  useEffect(() => {
    return () => {
      if (timer.current !== undefined) {
        window.clearTimeout(timer.current);
        timer.current = undefined;
      }
      const internal = internalAudioRef.current;
      if (internal) {
        try {
          internal.pause();
        } catch {
          /* ignore */
        }
        internal.src = "";
        internalAudioRef.current = null;
      }
      const ext = audioRef.current;
      if (ext) {
        try {
          ext.pause();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const play = useCallback(() => {
    const audio = getAudio();
    if (!audio) return;
    isPlayingRef.current = true;
    setIsPlaying(true);
    audio.play().catch(() => {
      isPlayingRef.current = false;
      setIsPlaying(false);
    });
  }, [getAudio]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    clearTimer();
    const audio = getAudio();
    if (audio) audio.pause();
  }, [getAudio, clearTimer]);

  const stop = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    loopRef.current = 0;
    setLoopCount(0);
    clearTimer();
    const audio = getAudio();
    if (audio) {
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        /* readyState may not allow seek yet */
      }
    }
  }, [getAudio, clearTimer]);

  const toggle = useCallback(() => {
    if (isPlayingRef.current) pause();
    else play();
  }, [pause, play]);

  const setGapSeconds = useCallback((next: number) => {
    gapRef.current = next;
    setGapSecondsState(next);
  }, []);

  return {
    audioRef,
    isPlaying,
    loopCount,
    gapSeconds,
    play,
    pause,
    stop,
    toggle,
    setGapSeconds,
  };
}
