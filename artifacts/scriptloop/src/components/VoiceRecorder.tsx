import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/**
 * Hard caps for self-recorded audio.
 *
 * - 10 minutes is well past any realistic monologue/scene length and
 *   keeps the resulting Blob comfortably under 10 MB at Opus bitrates.
 * - 15 MB is the upload-side guard for very high-bitrate codecs (e.g.
 *   the Safari/iOS MP4-AAC fallback). The presigned PUT to R2 has no
 *   server-side size cap, so this is the only enforcement layer.
 */
export const MAX_RECORDING_SECONDS = 10 * 60;
export const MAX_RECORDING_BYTES = 15 * 1024 * 1024;

/**
 * Pick the first MIME type the platform supports for `MediaRecorder`,
 * preferring Opus in WebM (Chrome/Firefox/Edge), then Opus in OGG, then
 * MP4/AAC (Safari). Returns `undefined` to let the browser default if
 * none are recognised — we still get *something* recordable.
 */
function pickMimeType(): { mimeType: string | undefined; extension: string } {
  if (typeof MediaRecorder === "undefined") {
    return { mimeType: undefined, extension: "webm" };
  }
  const candidates: { mime: string; ext: string }[] = [
    { mime: "audio/webm;codecs=opus", ext: "webm" },
    { mime: "audio/webm", ext: "webm" },
    { mime: "audio/ogg;codecs=opus", ext: "ogg" },
    { mime: "audio/mp4", ext: "m4a" },
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.mime)) {
      return { mimeType: c.mime, extension: c.ext };
    }
  }
  return { mimeType: undefined, extension: "webm" };
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export interface RecordedAudio {
  blob: Blob;
  durationSeconds: number;
  mimeType: string;
  extension: string;
}

export interface VoiceRecorderProps {
  /** Called when the user accepts the take. */
  onAccept: (audio: RecordedAudio) => void;
  /** Disable all controls (e.g. while a save is in flight). */
  disabled?: boolean;
}

type Phase = "idle" | "recording" | "preview";

/**
 * In-browser voice recorder built on `MediaRecorder` + a tiny
 * `AudioContext` analyser for level metering. Three phases:
 *
 *   idle     → "Start recording" button (requests mic on click)
 *   recording → live timer + level meter + "Stop"
 *   preview  → playable take + "Use this recording" / "Re-record"
 *
 * The component owns the MediaStream/Recorder/AudioContext lifecycles
 * and tears them all down on unmount or when the user re-records, so
 * the mic indicator always matches what the user sees on screen.
 *
 * The recorded `Blob` is handed back to the parent via `onAccept`; the
 * parent is responsible for uploading to R2 and persisting the URL.
 */
export function VoiceRecorder({ onAccept, disabled }: VoiceRecorderProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [recorded, setRecorded] = useState<RecordedAudio | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const chunksRef = useRef<BlobPart[]>([]);
  // Mirror of `previewUrl` so the unmount cleanup effect (which runs
  // with empty deps to fire only on unmount) can revoke whatever URL is
  // current at teardown time, not the initial `null` it would close
  // over otherwise.
  const previewUrlRef = useRef<string | null>(null);
  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  const stopMeters = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  // Cleanup on unmount: never leave the mic indicator on after the
  // component is gone from the tree.
  useEffect(() => {
    return () => {
      stopMeters();
      try {
        recorderRef.current?.state === "recording" &&
          recorderRef.current.stop();
      } catch {
        /* recorder already stopped */
      }
      releaseStream();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
    // Unmount-only: re-record paths revoke their own previous URL.
  }, [stopMeters, releaseStream]);

  const handleStart = useCallback(async () => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setError("Microphone access isn't available in this browser.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setError("Recording isn't supported in this browser.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = (err as { name?: string } | null)?.name ?? "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError(
          "Microphone permission was denied. Allow access in your browser to record.",
        );
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setError("No microphone was found on this device.");
      } else {
        setError(
          err instanceof Error ? err.message : "Couldn't start the microphone.",
        );
      }
      return;
    }

    streamRef.current = stream;

    // Live level meter via WebAudio. Wrapped in try/catch because
    // AudioContext can be blocked by autoplay policy in odd contexts;
    // we degrade silently to "no meter" rather than fail the recording.
    try {
      const ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      const buf = new Uint8Array(analyser.fftSize);
      const tickMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(buf);
        let peak = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = Math.abs((buf[i] ?? 128) - 128);
          if (v > peak) peak = v;
        }
        setLevel(Math.min(1, peak / 80));
        rafRef.current = requestAnimationFrame(tickMeter);
      };
      tickMeter();
    } catch {
      /* level meter is best-effort */
    }

    const { mimeType, extension } = pickMimeType();
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      stopMeters();
      const finalDuration = Math.max(
        0.1,
        (performance.now() - startedAtRef.current) / 1000,
      );
      const finalMime = recorder.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: finalMime });
      releaseStream();

      if (blob.size === 0) {
        setError("Recording was empty. Please try again.");
        setPhase("idle");
        return;
      }
      if (blob.size > MAX_RECORDING_BYTES) {
        setError(
          `Recording is too large (${(blob.size / 1024 / 1024).toFixed(
            1,
          )} MB). Limit is ${(MAX_RECORDING_BYTES / 1024 / 1024).toFixed(
            0,
          )} MB.`,
        );
        setPhase("idle");
        return;
      }

      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setRecorded({
        blob,
        durationSeconds: finalDuration,
        mimeType: finalMime,
        extension,
      });
      setPhase("preview");
    };

    startedAtRef.current = performance.now();
    setElapsed(0);
    setPhase("recording");
    recorder.start();

    // Wall-clock timer with hard cutoff at MAX_RECORDING_SECONDS — the
    // recorder's own `onstop` handler does the rest.
    tickRef.current = window.setInterval(() => {
      const next = (performance.now() - startedAtRef.current) / 1000;
      setElapsed(next);
      if (next >= MAX_RECORDING_SECONDS && recorder.state === "recording") {
        recorder.stop();
      }
    }, 200);
  }, [stopMeters, releaseStream]);

  const handleStop = useCallback(() => {
    try {
      if (recorderRef.current && recorderRef.current.state === "recording") {
        recorderRef.current.stop();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't stop recording.");
    }
  }, []);

  const handleReRecord = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setRecorded(null);
    setElapsed(0);
    setPhase("idle");
    setError(null);
  }, [previewUrl]);

  const handleAccept = useCallback(() => {
    if (recorded) onAccept(recorded);
  }, [recorded, onAccept]);

  return (
    <div className="space-y-3" data-testid="voice-recorder">
      <div className="space-y-1">
        <Label>Your recording</Label>
        <p className="text-xs text-muted-foreground">
          Up to {MAX_RECORDING_SECONDS / 60} minutes. Your recording is
          uploaded to the same public-by-design audio storage as
          AI-generated audio — re-recording rotates the URL.
        </p>
      </div>

      {phase === "idle" && (
        <div>
          <Button
            type="button"
            onClick={handleStart}
            disabled={disabled}
            variant="default"
          >
            Start recording
          </Button>
        </div>
      )}

      {phase === "recording" && (
        <div className="space-y-3 rounded-md border border-destructive/50 bg-destructive/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-destructive"
                aria-hidden
              />
              <span
                className="text-sm font-medium tabular-nums"
                aria-live="polite"
              >
                Recording {formatDuration(elapsed)} /{" "}
                {formatDuration(MAX_RECORDING_SECONDS)}
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleStop}
              disabled={disabled}
            >
              Stop
            </Button>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded bg-muted"
            aria-hidden
          >
            <div
              className="h-full bg-destructive transition-[width] duration-75"
              style={{ width: `${Math.round(level * 100)}%` }}
            />
          </div>
        </div>
      )}

      {phase === "preview" && recorded && previewUrl && (
        <div className="space-y-3 rounded-md border p-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Take captured ({formatDuration(recorded.durationSeconds)})
            </p>
            <p className="text-xs text-muted-foreground">
              Listen back, then keep it or record a new take.
            </p>
          </div>
          <audio
            src={previewUrl}
            controls
            preload="metadata"
            className="w-full"
            data-testid="recording-preview"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={handleAccept}
              disabled={disabled}
            >
              Use this recording
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReRecord}
              disabled={disabled}
            >
              Re-record
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
