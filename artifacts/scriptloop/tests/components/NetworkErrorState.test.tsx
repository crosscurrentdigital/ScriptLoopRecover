import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NetworkErrorState } from "@/components/NetworkErrorState";

afterEach(() => cleanup());

describe("NetworkErrorState", () => {
  it("shows default title and calls onRetry", () => {
    const onRetry = vi.fn();
    render(<NetworkErrorState onRetry={onRetry} />);
    expect(screen.getByText("Couldn't reach the server")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("renders custom title and message", () => {
    render(
      <NetworkErrorState
        title="Boom"
        message="explained"
        onRetry={() => {}}
      />,
    );
    expect(screen.getByText("Boom")).toBeInTheDocument();
    expect(screen.getByText("explained")).toBeInTheDocument();
  });

  it("disables button and changes label while retrying", () => {
    render(<NetworkErrorState onRetry={() => {}} isRetrying />);
    const btn = screen.getByRole("button", { name: /Retrying/i });
    expect(btn).toBeDisabled();
  });
});
