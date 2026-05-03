import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AudioPlayer } from "@/components/AudioPlayer";

beforeEach(() => {
  HTMLMediaElement.prototype.play = vi.fn(function (this: HTMLMediaElement) {
    Object.defineProperty(this, "paused", { value: false, configurable: true });
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  });
  HTMLMediaElement.prototype.pause = vi.fn(function (this: HTMLMediaElement) {
    Object.defineProperty(this, "paused", { value: true, configurable: true });
    this.dispatchEvent(new Event("pause"));
  });
  HTMLMediaElement.prototype.load = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AudioPlayer", () => {
  it("renders Play/Stop buttons and gap selector", () => {
    render(<AudioPlayer audioUrl="https://x/a.mp3" />);
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /Loop gap/ }),
    ).toBeInTheDocument();
  });

  it("clicking Play toggles to Pause", async () => {
    render(<AudioPlayer audioUrl="https://x/a.mp3" />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(
      await screen.findByRole("button", { name: "Pause" }),
    ).toBeInTheDocument();
  });

  it("disables controls when no URL", () => {
    render(<AudioPlayer audioUrl="" />);
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Stop" })).toBeDisabled();
  });

  it("shows error fallback when audio errors and Regenerate calls back", () => {
    const onRegenerate = vi.fn();
    render(
      <AudioPlayer audioUrl="https://x/a.mp3" onRegenerate={onRegenerate} />,
    );
    const audio = document.querySelector("audio") as HTMLAudioElement;
    fireEvent.error(audio);
    expect(screen.getByText(/Audio failed to load/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
    expect(onRegenerate).toHaveBeenCalled();
  });

  it("Try again from error state recovers to playable UI", () => {
    render(<AudioPlayer audioUrl="https://x/a.mp3" />);
    const audio = document.querySelector("audio") as HTMLAudioElement;
    fireEvent.error(audio);
    fireEvent.click(screen.getByRole("button", { name: /Try again/ }));
    expect(screen.queryByText(/Audio failed to load/)).not.toBeInTheDocument();
  });
});
