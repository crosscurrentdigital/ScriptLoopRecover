import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const captureExceptionMock = vi.fn();
vi.mock("@/lib/sentry", () => ({
  SentrySDK: { captureException: captureExceptionMock },
}));

const { ErrorBoundary } = await import("@/components/ErrorBoundary");

function Boom({ throwIt }: { throwIt: boolean }) {
  if (throwIt) throw new Error("kaboom");
  return <div data-testid="ok">ok</div>;
}

beforeEach(() => {
  captureExceptionMock.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <Boom throwIt={false} />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("ok")).toBeInTheDocument();
  });

  it("catches errors, captures to Sentry, and shows fallback", () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <Boom throwIt />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("kaboom")).toBeInTheDocument();
    expect(captureExceptionMock).toHaveBeenCalled();
  });

  it("Try again resets state", () => {
    let shouldThrow = true;
    function Toggle() {
      if (shouldThrow) throw new Error("first");
      return <div data-testid="recovered" />;
    }
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <Toggle />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));
    expect(screen.getByTestId("recovered")).toBeInTheDocument();
  });
});
