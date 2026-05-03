import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  AudioPrivacyConsent,
  hasAudioPrivacyAck,
} from "@/components/AudioPrivacyConsent";

beforeEach(() => window.localStorage.clear());
afterEach(() => cleanup());

describe("AudioPrivacyConsent", () => {
  it("shows the unchecked consent box when not acknowledged", () => {
    const onChange = vi.fn();
    render(
      <MemoryRouter>
        <AudioPrivacyConsent onChange={onChange} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/I understand/)).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("checking the box persists and switches to reminder", () => {
    const onChange = vi.fn();
    render(
      <MemoryRouter>
        <AudioPrivacyConsent onChange={onChange} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(hasAudioPrivacyAck()).toBe(true);
    expect(screen.getByText(/Heads up/)).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(true);
  });

  it("hasAudioPrivacyAck reads localStorage", () => {
    expect(hasAudioPrivacyAck()).toBe(false);
    window.localStorage.setItem("scriptloop:audio-privacy-ack:v1", "1");
    expect(hasAudioPrivacyAck()).toBe(true);
  });

  it("renders the reminder when ack already stored", () => {
    window.localStorage.setItem("scriptloop:audio-privacy-ack:v1", "1");
    render(
      <MemoryRouter>
        <AudioPrivacyConsent />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Heads up/)).toBeInTheDocument();
  });
});
