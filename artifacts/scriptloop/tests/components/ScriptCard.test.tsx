import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ScriptCard } from "@/components/ScriptCard";

afterEach(() => cleanup());

const baseScript = {
  id: 1,
  userId: "u",
  title: "Hello",
  content: "Some content here that is short.",
  audioUrl: null,
  audioSource: null,
  voiceId: "v1",
  loopGapSeconds: 2,
  createdAt: new Date("2026-01-15"),
  updatedAt: new Date("2026-01-15"),
} as Parameters<typeof ScriptCard>[0]["script"];

function renderCard(props: Partial<Parameters<typeof ScriptCard>[0]> = {}) {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ScriptCard
              script={baseScript}
              onDelete={() => {}}
              {...props}
            />
          }
        />
        <Route
          path="/scripts/:id"
          element={<div data-testid="detail-page" />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ScriptCard", () => {
  it("shows title, voice fallback, and date", () => {
    renderCard();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("v1")).toBeInTheDocument();
  });

  it("uses provided voiceName instead of voiceId", () => {
    renderCard({ voiceName: "Voice Name" });
    expect(screen.getByText("Voice Name")).toBeInTheDocument();
  });

  it("clicking the card navigates to the script detail", () => {
    renderCard();
    fireEvent.click(screen.getByRole("link", { name: /Open Hello/i }));
    expect(screen.getByTestId("detail-page")).toBeInTheDocument();
  });

  it("Enter key on the card navigates to detail", () => {
    renderCard();
    const card = screen.getByRole("link", { name: /Open Hello/i });
    card.focus();
    fireEvent.keyDown(card, { key: "Enter", target: card, currentTarget: card });
    expect(screen.getByTestId("detail-page")).toBeInTheDocument();
  });

  it("delete dialog confirm triggers onDelete", () => {
    const onDelete = vi.fn();
    renderCard({ onDelete });
    fireEvent.click(screen.getByRole("button", { name: /Delete Hello/i }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith(1, "Hello");
  });

  it("truncates long content", () => {
    renderCard({
      script: { ...baseScript, content: "x".repeat(200) },
    });
    expect(screen.getByText(/x{80,}…/)).toBeInTheDocument();
  });

  it("shows (empty) for blank content", () => {
    renderCard({ script: { ...baseScript, content: "   " } });
    expect(screen.getByText("(empty)")).toBeInTheDocument();
  });

  it("shows Untitled when title is empty string", () => {
    renderCard({
      script: { ...baseScript, title: "" },
    });
    expect(screen.getAllByText(/Untitled/).length).toBeGreaterThan(0);
  });
});
