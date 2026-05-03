import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { VoiceRecorder } from "@/components/VoiceRecorder";

// Minimal MediaRecorder fake. We only model what the component
// actually uses: ondataavailable + onstop callbacks, start(), stop(),
// and a `state` field. The component constructs it directly so the
// constructor needs to accept (stream, options?) and capture them.
class FakeMediaRecorder {
  static isTypeSupported = vi.fn(() => true);
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  state: "inactive" | "recording" | "paused" = "inactive";
  mimeType: string;
  constructor(_stream: unknown, opts?: { mimeType?: string }) {
    this.mimeType = opts?.mimeType ?? "audio/webm";
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    // Emit one chunk and then onstop, like the real MediaRecorder.
    this.ondataavailable?.({
      data: new Blob([new Uint8Array([1, 2, 3, 4])], { type: this.mimeType }),
    });
    this.onstop?.();
  }
}

const fakeStream = { getTracks: () => [{ stop: vi.fn() }] };

beforeEach(() => {
  vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
  vi.stubGlobal("navigator", {
    ...globalThis.navigator,
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue(fakeStream),
    },
  });
  // The component creates an AudioContext for the level meter; stub it
  // so we don't depend on jsdom WebAudio support.
  vi.stubGlobal(
    "AudioContext",
    class {
      state = "running";
      createMediaStreamSource() {
        return { connect: () => {} };
      }
      createAnalyser() {
        return {
          fftSize: 512,
          getByteTimeDomainData: () => {},
        };
      }
      close() {
        return Promise.resolve();
      }
    },
  );
  // jsdom doesn't implement these on `URL`, and spreading the
  // constructor drops them. Assign directly so the unmount cleanup
  // (which now correctly revokes the latest preview URL via a ref)
  // has something to call.
  (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL =
    vi.fn(() => "blob:fake");
  (URL as unknown as { revokeObjectURL: (u: string) => void }).revokeObjectURL =
    vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  cleanup();
});

describe("VoiceRecorder", () => {
  it("walks idle → recording → preview and yields a take to onAccept", async () => {
    const onAccept = vi.fn();
    render(<VoiceRecorder onAccept={onAccept} />);

    // Phase: idle
    const startBtn = screen.getByRole("button", { name: /start recording/i });
    expect(startBtn).toBeInTheDocument();

    fireEvent.click(startBtn);

    // Phase: recording — Stop appears, mic was requested.
    const stopBtn = await screen.findByRole("button", { name: /^stop$/i });
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: true,
    });

    fireEvent.click(stopBtn);

    // Phase: preview — accept the take.
    const acceptBtn = await screen.findByRole("button", {
      name: /use this recording/i,
    });
    fireEvent.click(acceptBtn);

    await waitFor(() => expect(onAccept).toHaveBeenCalledTimes(1));
    const audio = onAccept.mock.calls[0][0];
    expect(audio.blob).toBeInstanceOf(Blob);
    expect(audio.blob.size).toBeGreaterThan(0);
    expect(audio.mimeType).toMatch(/audio\//);
    expect(audio.extension).toMatch(/^(webm|ogg|m4a)$/);
    expect(audio.durationSeconds).toBeGreaterThan(0);
  });

  it("surfaces a friendly error when mic permission is denied", async () => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      Object.assign(new Error("denied"), { name: "NotAllowedError" }),
    );
    render(<VoiceRecorder onAccept={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /start recording/i }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/permission was denied/i);
    // Stayed in idle so the user can retry.
    expect(
      screen.getByRole("button", { name: /start recording/i }),
    ).toBeInTheDocument();
  });

  it("re-record discards the take and returns to idle", async () => {
    const onAccept = vi.fn();
    render(<VoiceRecorder onAccept={onAccept} />);
    fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^stop$/i }));
    fireEvent.click(
      await screen.findByRole("button", { name: /re-record/i }),
    );
    expect(
      await screen.findByRole("button", { name: /start recording/i }),
    ).toBeInTheDocument();
    expect(onAccept).not.toHaveBeenCalled();
  });
});
