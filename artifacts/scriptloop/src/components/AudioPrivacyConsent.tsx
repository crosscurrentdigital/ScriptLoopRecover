import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "scriptloop:audio-privacy-ack:v1";

/**
 * One-time consent for the public-by-design audio storage posture
 * (see `replit.md` → Audio privacy posture). The checkbox state is
 * persisted in localStorage so we don't nag the user on every generate;
 * the parent uses {@link hasAudioPrivacyAck} to gate the action.
 *
 * `mode="strict"` requires the user to acknowledge before they can
 * generate audio (used for the very first run on this device).
 * `mode="reminder"` shows a passive one-line note (used after ack and on
 * the regenerate flow).
 */
export function hasAudioPrivacyAck(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function setAudioPrivacyAck(value: boolean): void {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* localStorage may be unavailable (private mode); harmless */
  }
}

export interface AudioPrivacyConsentProps {
  onChange?: (acknowledged: boolean) => void;
}

export function AudioPrivacyConsent({ onChange }: AudioPrivacyConsentProps) {
  const [checked, setChecked] = useState<boolean>(() => hasAudioPrivacyAck());

  useEffect(() => {
    onChange?.(checked);
  }, [checked, onChange]);

  if (checked) {
    return (
      <p className="text-xs text-muted-foreground">
        Heads up: generated audio is stored at a public, hard-to-guess URL.
        Regenerating creates a new URL and effectively rotates the old one.{" "}
        <Link to="/privacy" className="underline underline-offset-2">
          Privacy details
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="rounded-md border border-amber-500/40 bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
      <div className="flex items-start gap-2">
        <Checkbox
          id="audio-privacy-ack"
          checked={checked}
          onCheckedChange={(v) => {
            const next = v === true;
            setChecked(next);
            setAudioPrivacyAck(next);
          }}
          className="mt-0.5"
        />
        <Label
          htmlFor="audio-privacy-ack"
          className="text-sm font-normal leading-snug"
        >
          I understand that the generated audio file will be stored at a{" "}
          <strong>public, hard-to-guess URL</strong>. Anyone who gets the URL
          (browser history, copy/paste, share) can play the audio. Regenerating
          creates a new URL and effectively retires the old one.{" "}
          <Link to="/privacy" className="underline underline-offset-2">
            Read the full privacy policy
          </Link>
          .
        </Label>
      </div>
    </div>
  );
}
