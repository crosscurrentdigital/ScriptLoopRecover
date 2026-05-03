import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ProgressiveText } from "@/components/ProgressiveText";

afterEach(() => cleanup());

describe("ProgressiveText", () => {
  it("shows '(empty)' when text is blank", () => {
    render(<ProgressiveText text="" loopCount={0} />);
    expect(screen.getByText("(empty)")).toBeInTheDocument();
  });

  it("shows 'All words visible' on loop 0", () => {
    render(<ProgressiveText text="one two three" loopCount={0} />);
    expect(screen.getByText(/All words visible/)).toBeInTheDocument();
  });

  it("shows hidden count after some loops", () => {
    render(
      <ProgressiveText
        text="one two three four five six"
        loopCount={6}
        hideStrategy="last-words"
      />,
    );
    expect(screen.getByText(/words hidden/)).toBeInTheDocument();
  });

  it("Peek button reveals hidden words while held", () => {
    render(
      <ProgressiveText
        text="alpha beta gamma delta"
        loopCount={6}
        hideStrategy="last-words"
      />,
    );
    const btn = screen.getByRole("button", { name: /Hold to reveal/ });
    fireEvent.pointerDown(btn);
    expect(btn).toHaveAttribute("aria-pressed", "true");
    fireEvent.pointerUp(btn);
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("can hide the peek button via prop", () => {
    render(
      <ProgressiveText text="x" loopCount={0} showPeekButton={false} />,
    );
    expect(
      screen.queryByRole("button", { name: /Hold to reveal/ }),
    ).not.toBeInTheDocument();
  });
});
